import { TRIP_STATUSES } from '@platform/contracts';
import type { TripRepository } from '../application/ports';
import type { TripRecord } from '../domain/trip';

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
  status: string;
  meeting_lat: number | null;
  meeting_lng: number | null;
  meeting_message_id: number | null;
  created_at: number;
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
  status: TRIP_STATUSES.find((status) => status === row.status) ?? 'cancelled',
  meetingPoint:
    row.meeting_lat === null || row.meeting_lng === null
      ? null
      : { lat: row.meeting_lat, lng: row.meeting_lng },
  meetingMessageId: row.meeting_message_id,
  createdAt: row.created_at,
});

const UPSERT = `INSERT INTO trips (id, driver_id, from_id, to_id, depart_at, ends_at, km, seats, price,
  woman_on_board, comment, status, meeting_lat, meeting_lng, meeting_message_id, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT (id) DO UPDATE SET status = excluded.status, meeting_lat = excluded.meeting_lat,
  meeting_lng = excluded.meeting_lng, meeting_message_id = excluded.meeting_message_id`;

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
        trip.meetingPoint?.lat ?? null,
        trip.meetingPoint?.lng ?? null,
        trip.meetingMessageId,
        trip.createdAt,
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
  byMeetingMessage: async (driverId, messageId) => {
    const row = await db
      .prepare('SELECT * FROM trips WHERE driver_id = ? AND meeting_message_id = ?')
      .bind(driverId, messageId)
      .first<Row>();
    return row ? toTrip(row) : undefined;
  },
  leaving: async (from, to) =>
    (
      await db
        .prepare(
          "SELECT * FROM trips WHERE status = 'active' AND depart_at >= ? AND depart_at < ? ORDER BY depart_at",
        )
        .bind(from, to)
        .all<Row>()
    ).results.map(toTrip),
  completeOver: async (now) => {
    await db
      .prepare("UPDATE trips SET status = 'completed' WHERE status IN ('active', 'full') AND ends_at <= ?")
      .bind(now)
      .run();
  },
});
