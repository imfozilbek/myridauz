import { PICKUP_MODES, REQUEST_STATUSES } from '@platform/contracts';
import type { RequestRepository } from '../application/ports';
import type { RequestRecord } from '../domain/ride-request';

type Row = {
  id: string;
  passenger_id: number;
  from_id: string;
  to_id: string;
  date: string;
  expires_at: number;
  km: number;
  seats: number;
  price: number;
  whole_car: number;
  with_woman: number;
  status: string;
  pickup_mode: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  calls_off: number;
  created_at: number;
};

const pointOf = (lat: number | null, lng: number | null) =>
  lat === null || lng === null ? null : { lat, lng };

const toRequest = (row: Row): RequestRecord => ({
  id: row.id,
  passengerId: row.passenger_id,
  from: row.from_id,
  to: row.to_id,
  date: row.date,
  expiresAt: row.expires_at,
  km: row.km,
  seats: row.seats,
  price: row.price,
  wholeCar: row.whole_car === 1,
  withWoman: row.with_woman === 1,
  status: REQUEST_STATUSES.find((status) => status === row.status) ?? 'cancelled',
  pickupMode: PICKUP_MODES.find((mode) => mode === row.pickup_mode) ?? 'both',
  pickup: pointOf(row.pickup_lat, row.pickup_lng),
  dropoff: pointOf(row.dropoff_lat, row.dropoff_lng),
  callsOff: row.calls_off === 1,
  createdAt: row.created_at,
});

const UPSERT = `INSERT INTO ride_requests (id, passenger_id, from_id, to_id, date, expires_at, km, seats, price,
  status, pickup_mode, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, created_at, whole_car, with_woman,
  calls_off) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT (id) DO UPDATE SET status = excluded.status, pickup_lat = excluded.pickup_lat,
  pickup_lng = excluded.pickup_lng, dropoff_lat = excluded.dropoff_lat, dropoff_lng = excluded.dropoff_lng,
  calls_off = excluded.calls_off`;
const NO_POINTS = 'pickup_lat = NULL, pickup_lng = NULL, dropoff_lat = NULL, dropoff_lng = NULL';

// Table ride_requests (migrations/0007_trips.sql, 0045_request_marks.sql, 0051_request_talks.sql).
export const d1Requests = (db: D1Database): RequestRepository => ({
  save: async (request) => {
    await db
      .prepare(UPSERT)
      .bind(
        request.id,
        request.passengerId,
        request.from,
        request.to,
        request.date,
        request.expiresAt,
        request.km,
        request.seats,
        request.price,
        request.status,
        request.pickupMode,
        request.pickup?.lat ?? null,
        request.pickup?.lng ?? null,
        request.dropoff?.lat ?? null,
        request.dropoff?.lng ?? null,
        request.createdAt,
        request.wholeCar ? 1 : 0,
        request.withWoman ? 1 : 0,
        request.callsOff ? 1 : 0,
      )
      .run();
  },
  find: async (id) => {
    const row = await db.prepare('SELECT * FROM ride_requests WHERE id = ?').bind(id).first<Row>();
    return row ? toRequest(row) : undefined;
  },
  byPassenger: async (passengerId) =>
    (
      await db.prepare('SELECT * FROM ride_requests WHERE passenger_id = ?').bind(passengerId).all<Row>()
    ).results.map(toRequest),
  openOn: async (date) =>
    (
      await db
        .prepare("SELECT * FROM ride_requests WHERE status = 'open' AND date = ? ORDER BY created_at")
        .bind(date)
        .all<Row>()
    ).results.map(toRequest),
  // Through the index (status, date): the open requests from this day on (G64).
  openFrom: async (date) =>
    (
      await db
        .prepare("SELECT * FROM ride_requests WHERE status = 'open' AND date >= ? ORDER BY created_at")
        .bind(date)
        .all<Row>()
    ).results.map(toRequest),
  expireOver: async (now) => {
    const burned = await db
      .prepare(
        `UPDATE ride_requests SET status = 'expired', ${NO_POINTS} WHERE status = 'open' AND expires_at <= ? RETURNING id`,
      )
      .bind(now)
      .all<{ id: string }>();
    return burned.results.map((row) => row.id);
  },
  erasePointsOf: async (passengerId) => {
    await db.prepare(`UPDATE ride_requests SET ${NO_POINTS} WHERE passenger_id = ?`).bind(passengerId).run();
  },
});
