import { allIn } from '../../../shared/storage/in-list';
import type { TripRepository } from '../application/ports';
import { toTrip, type TripRow as Row } from './trip-row';
import { ARRIVE, CANCEL, DEPART, LIVE, NOT_DEPARTED, UPSERT } from './trip-sql';

const changed = (result: D1Result) => result.meta.changes === 1;

// Table trips (migrations 0007, 0035, 0043, 0046, 0051, 0080, 0086). The route never changes; the
// driver moves the time later and lowers the price (G39, docs/104). save never writes the marks of the
// road nor the status: a change read before a cancel or a departure writes nothing (G89 T7).
export const d1Trips = (db: D1Database): TripRepository => ({
  save: async (trip) =>
    changed(
      await db
        .prepare(UPSERT)
        .bind(
          trip.id,
          trip.driverId,
          trip.from,
          trip.to,
          trip.departAt,
          trip.departUntil,
          trip.endsAt,
          trip.km,
          trip.seats,
          trip.price,
          trip.womanOnBoard ? 1 : 0,
          trip.comment,
          trip.status,
          trip.pickupMode,
          trip.createdAt,
          trip.car?.make ?? null,
          trip.car?.model ?? null,
          trip.car?.color ?? null,
          trip.car?.plate ?? null,
          trip.firstDepartAt,
          trip.firstPrice,
          trip.priceToldAt,
          trip.bookingRule,
          trip.forRequest,
          trip.pitakId,
        )
        .run(),
    ),
  find: async (id) => {
    const row = await db.prepare('SELECT * FROM trips WHERE id = ?').bind(id).first<Row>();
    return row ? toTrip(row) : undefined;
  },
  byDriver: async (driverId) =>
    (await db.prepare('SELECT * FROM trips WHERE driver_id = ?').bind(driverId).all<Row>()).results.map(
      toTrip,
    ),
  latestOf: async (driverId, limit) =>
    (
      await db
        .prepare('SELECT * FROM trips WHERE driver_id = ? ORDER BY depart_at DESC LIMIT ?')
        .bind(driverId, limit)
        .all<Row>()
    ).results.map(toTrip),
  departing: async (from, to) =>
    (
      await db
        .prepare(
          "SELECT * FROM trips WHERE status IN ('active', 'full') AND depart_at >= ? AND depart_at < ?",
        )
        .bind(from, to)
        .all<Row>()
    ).results.map(toTrip),
  ended: async (from, to) =>
    (
      await db
        .prepare("SELECT * FROM trips WHERE status != 'cancelled' AND ends_at >= ? AND ends_at < ?")
        .bind(from, to)
        .all<Row>()
    ).results.map(toTrip),
  // Through trips_from (migration 0040): only the trips from the places of the search (G56); a trip
  // opened for one request is nobody else's (G64).
  leaving: async (from, to, places) =>
    (
      await allIn<Row>(
        db,
        (marks) =>
          `SELECT * FROM trips WHERE status = 'active' AND depart_at >= ? AND depart_at < ? AND departed_at IS NULL AND for_request IS NULL AND from_id IN (${marks})`,
        places,
        [from, to],
      )
    )
      .map(toTrip)
      .sort((a, b) => a.departAt - b.departAt),
  // Both read by the index trips_depart (migration 0028), not the whole table (docs/90 F-A6).
  between: async (from, to, limit) =>
    (
      await db
        .prepare('SELECT * FROM trips WHERE depart_at >= ? AND depart_at < ? ORDER BY depart_at LIMIT ?')
        .bind(from, to, limit)
        .all<Row>()
    ).results.map(toTrip),
  pricedBetween: async (from, to, limit) =>
    (
      await db
        .prepare(
          "SELECT * FROM trips WHERE depart_at >= ? AND depart_at < ? AND status != 'cancelled' ORDER BY depart_at DESC LIMIT ?",
        )
        .bind(from, to, limit)
        .all<Row>()
    ).results.map(toTrip),
  completeOver: async (now) =>
    (
      await db
        .prepare(`UPDATE trips SET status = 'completed' WHERE ${LIVE} AND ends_at <= ? RETURNING id`)
        .bind(now)
        .all<{ id: string }>()
    ).results.map((row) => row.id),
  depart: async (id, at) => changed(await db.prepare(DEPART).bind(at, id).run()),
  arrive: async (id, at) => changed(await db.prepare(ARRIVE).bind(at, id, at).run()),
  cancel: async (id) => changed(await db.prepare(CANCEL).bind(id).run()),
  // Through trips_search (status, depart_at): only the trips of the window (docs/117).
  notDeparted: async (from, to, longest) =>
    (
      await db
        .prepare(NOT_DEPARTED)
        .bind(from - longest, to, from, to)
        .all<Row>()
    ).results.map(toTrip),
  // Through trips_search (status, depart_at) (docs/117).
  cancelledAfter: async (after) =>
    (
      await db
        .prepare("SELECT id FROM trips WHERE status = 'cancelled' AND depart_at > ?")
        .bind(after)
        .all<{ id: string }>()
    ).results.map((row) => row.id),
});
