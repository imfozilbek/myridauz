import { allIn } from '../../../shared/storage/in-list';
import type { TripRepository } from '../application/ports';
import { toTrip, type TripRow as Row } from './trip-row';

const UPSERT = `INSERT INTO trips (id, driver_id, from_id, to_id, depart_at, ends_at, km, seats, price,
  woman_on_board, comment, status, pickup_mode, created_at, car_make, car_model, car_color, car_plate,
  first_depart_at, first_price, price_told_at, booking_rule, for_request)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT (id) DO UPDATE SET status = excluded.status, depart_at = excluded.depart_at,
  ends_at = excluded.ends_at, price = excluded.price, price_told_at = excluded.price_told_at,
  for_request = excluded.for_request`;

// «Yoʻlga chiqdim», «Yetib keldik» and the cancel (G63): one conditional write each, like the confirm
// of a booking; a cancel, a departure, the completion Cron or a second tap that came first wins.
const LIVE = "status IN ('active', 'full')";
const DEPART = `UPDATE trips SET departed_at = ? WHERE id = ? AND departed_at IS NULL AND ${LIVE}`;
const ARRIVE = `UPDATE trips SET departed_at = COALESCE(departed_at, depart_at), arrived_at = ?
  WHERE id = ? AND arrived_at IS NULL AND ${LIVE} AND (departed_at IS NOT NULL OR depart_at <= ?)`;
const CANCEL = `UPDATE trips SET status = 'cancelled' WHERE id = ? AND ${LIVE} AND departed_at IS NULL`;
const changed = (result: D1Result) => result.meta.changes === 1;

// Table trips (migrations 0007, 0035, 0043, 0046, 0051). The route never changes; the driver moves the time
// later and lowers the price (G39, docs/104). save never writes the marks of the road.
export const d1Trips = (db: D1Database): TripRepository => ({
  save: async (trip) => {
    await db
      .prepare(UPSERT)
      .bind(
        trip.id,
        trip.driverId,
        trip.from,
        trip.to,
        trip.departAt,
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
      )
      .run();
  },
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
  notDeparted: async (from, to) =>
    (
      await db
        .prepare(
          `SELECT * FROM trips WHERE ${LIVE} AND depart_at >= ? AND depart_at <= ? AND departed_at IS NULL`,
        )
        .bind(from, to)
        .all<Row>()
    ).results.map(toTrip),
});
