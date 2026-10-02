import { CAR_COLORS, PICKUP_MODES, TRIP_STATUSES } from '@platform/contracts';
import type { TripRepository } from '../application/ports';
import type { TripCar, TripRecord } from '../domain/trip';

type Row = {
  id: string;
  driver_id: number;
  from_id: string;
  to_id: string;
  depart_at: number;
  ends_at: number;
  km: number;
  seats: number;
  price: number;
  woman_on_board: number;
  comment: string;
  car_make: string | null;
  car_model: string | null;
  car_color: string | null;
  car_plate: string | null;
  status: string;
  pickup_mode: string;
  created_at: number;
};

const carOf = (row: Row): TripCar | null => {
  const color = CAR_COLORS.find((item) => item === row.car_color);
  if (row.car_make === null || row.car_model === null || !color || row.car_plate === null) return null;
  return { make: row.car_make, model: row.car_model, color, plate: row.car_plate };
};

const toTrip = (row: Row): TripRecord => ({
  id: row.id,
  driverId: row.driver_id,
  from: row.from_id,
  to: row.to_id,
  departAt: row.depart_at,
  endsAt: row.ends_at,
  km: row.km,
  seats: row.seats,
  price: row.price,
  womanOnBoard: row.woman_on_board === 1,
  comment: row.comment,
  car: carOf(row),
  status: TRIP_STATUSES.find((status) => status === row.status) ?? 'cancelled',
  pickupMode: PICKUP_MODES.find((mode) => mode === row.pickup_mode) ?? 'both',
  createdAt: row.created_at,
});

const UPSERT = `INSERT INTO trips (id, driver_id, from_id, to_id, depart_at, ends_at, km, seats, price,
  woman_on_board, comment, status, pickup_mode, created_at, car_make, car_model, car_color, car_plate)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT (id) DO UPDATE SET status = excluded.status`;

// Table trips (migrations/0007_trips.sql). Route and price never change after publishing (docs/23).
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
