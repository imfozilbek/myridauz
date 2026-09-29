import { REQUEST_STATUSES } from '@platform/contracts';
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
  status: string;
  created_at: number;
};

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
  status: REQUEST_STATUSES.find((status) => status === row.status) ?? 'cancelled',
  createdAt: row.created_at,
});

const UPSERT = `INSERT INTO ride_requests (id, passenger_id, from_id, to_id, date, expires_at, km, seats, price,
  status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT (id) DO UPDATE SET status = excluded.status`;

// Table ride_requests (migrations/0007_trips.sql).
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
        request.createdAt,
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
  expireOver: async (now) => {
    await db
      .prepare("UPDATE ride_requests SET status = 'expired' WHERE status = 'open' AND expires_at <= ?")
      .bind(now)
      .run();
  },
});
