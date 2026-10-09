import type { BookingRepository } from '../application/ports';
import { allIn } from '../../../shared/storage/in-list';
import {
  POINT_COLUMNS,
  pointValues,
  ROW_COLUMNS,
  rowValues,
  toBooking,
  type BookingRow,
} from './booking-row';
import { MARK_COLUMNS, markOnceSql } from './mark-row';

// Table bookings (migrations/0008_bookings_wallet.sql, 0024, 0026, 0047).
const marks = (count: number) => Array.from({ length: count }, () => '?').join(', ');
const NO_POINTS = POINT_COLUMNS.map((column) => `${column} = NULL`).join(', ');
const SET_POINTS = POINT_COLUMNS.map((column) => `${column} = ?`).join(', ');
// The marks of the driver are set once: a save of an older copy keeps them (G63).
const KEEP_MARKS = MARK_COLUMNS.map((c) => `${c} = COALESCE(excluded.${c}, bookings.${c})`).join(', ');
const UPSERT = `INSERT INTO bookings (${ROW_COLUMNS.join(', ')}, id) VALUES (${marks(ROW_COLUMNS.length + 1)})
  ON CONFLICT (id) DO UPDATE SET status = excluded.status, ${POINT_COLUMNS.map((c) => `${c} = excluded.${c}`).join(', ')},
    confirmed_at = excluded.confirmed_at, boarded_at = excluded.boarded_at,
    arrived_at = excluded.arrived_at, came_at = excluded.came_at, ${KEEP_MARKS},
    updated_at = excluded.updated_at`;
// One statement: the seats of the trip are counted and the booking confirmed at once (docs/65 A4).
const CONFIRM_WITHIN = `UPDATE bookings SET status = 'confirmed', confirmed_at = ?1, updated_at = ?1
  WHERE id = ?2 AND status = 'requested' AND seats + (SELECT COALESCE(SUM(seats), 0) FROM bookings
  WHERE trip_id = ?3 AND status = 'confirmed') <= ?4`;
// A request without an answer ends, and its points with it (docs/69).
const EXPIRE = `UPDATE bookings SET status = 'expired', ${NO_POINTS}, updated_at = ?1
  WHERE status = 'requested' AND expires_at <= ?1 RETURNING *`;
// Through the index bookings_status: only the requests still waiting (docs/117).
const PAST_HALF = `SELECT * FROM bookings
  WHERE status = 'requested' AND expires_at > ?1 AND created_at + expires_at <= 2 * ?1`;
const WITH_POINTS = `SELECT id, trip_id FROM bookings
  WHERE (pickup_lat IS NOT NULL OR dropoff_lat IS NOT NULL) AND created_at < ?`;

const all = async (statement: D1PreparedStatement) =>
  (await statement.all<BookingRow>()).results.map(toBooking);

export const d1Bookings = (db: D1Database): BookingRepository => ({
  save: async (booking) => {
    await db
      .prepare(UPSERT)
      .bind(...rowValues(booking), booking.id)
      .run();
  },
  // The status and the points move together: a cancel erases the points in the same step.
  replace: async (booking, expected) => {
    const result = await db
      .prepare(`UPDATE bookings SET status = ?, ${SET_POINTS}, updated_at = ? WHERE id = ? AND status = ?`)
      .bind(booking.status, ...pointValues(booking), booking.updatedAt, booking.id, expected)
      .run();
    return result.meta.changes === 1;
  },
  confirmWithin: async (booking, tripSeats) => {
    const result = await db
      .prepare(CONFIRM_WITHIN)
      .bind(booking.updatedAt, booking.id, booking.tripId, tripSeats)
      .run();
    return result.meta.changes === 1;
  },
  markOnce: async (id, step, now) =>
    (await db.prepare(markOnceSql(step)).bind(now, id).run()).meta.changes === 1,
  find: async (id) => {
    const row = await db.prepare('SELECT * FROM bookings WHERE id = ?').bind(id).first<BookingRow>();
    return row ? toBooking(row) : undefined;
  },
  byTrips: async (tripIds) =>
    (await allIn<BookingRow>(db, (list) => `SELECT * FROM bookings WHERE trip_id IN (${list})`, tripIds)).map(
      toBooking,
    ),
  byPassenger: async (passengerId) =>
    all(db.prepare('SELECT * FROM bookings WHERE passenger_id = ?').bind(passengerId)),
  expireOver: (now) => all(db.prepare(EXPIRE).bind(now)),
  waitingPastHalf: (now) => all(db.prepare(PAST_HALF).bind(now)),
  keepingPoints: async (before) =>
    (await db.prepare(WITH_POINTS).bind(before).all<{ id: string; trip_id: string }>()).results.map(
      (row) => ({
        id: row.id,
        tripId: row.trip_id,
      }),
    ),
  erasePoints: async (ids) => {
    await allIn(db, (list) => `UPDATE bookings SET ${NO_POINTS} WHERE id IN (${list})`, ids);
  },
  erasePointsOf: async (passengerId) => {
    await db.prepare(`UPDATE bookings SET ${NO_POINTS} WHERE passenger_id = ?`).bind(passengerId).run();
  },
});
