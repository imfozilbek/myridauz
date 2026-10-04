import type { TripRepository } from '../application/ports';
import { toTrip, type TripRow as Row } from './trip-row';

const UPSERT = `INSERT INTO trips (id, driver_id, from_id, to_id, depart_at, ends_at, km, seats, price,
  woman_on_board, comment, status, pickup_mode, created_at, car_make, car_model, car_color, car_plate,
  first_depart_at, first_price, price_told_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT (id) DO UPDATE SET status = excluded.status, depart_at = excluded.depart_at,
  ends_at = excluded.ends_at, price = excluded.price, price_told_at = excluded.price_told_at`;

// Table trips (migrations 0007, 0035). The route never changes; the driver moves the time later and
// lowers the price (G39, docs/104).
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
  leaving: async (from, to) =>
    (
      await db
        .prepare(
          "SELECT * FROM trips WHERE status = 'active' AND depart_at >= ? AND depart_at < ? ORDER BY depart_at",
        )
        .bind(from, to)
        .all<Row>()
    ).results.map(toTrip),
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
  completeOver: async (now) => {
    await db
      .prepare("UPDATE trips SET status = 'completed' WHERE status IN ('active', 'full') AND ends_at <= ?")
      .bind(now)
      .run();
  },
});
