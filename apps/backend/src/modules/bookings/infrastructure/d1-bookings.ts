import type { BookingStatus } from '@platform/contracts';
import type { BookingRepository } from '../application/ports';
import type { BookingRecord } from '../domain/booking';

type Row = {
  id: string;
  trip_id: string;
  passenger_id: number;
  seats: number;
  price: number;
  commission: number;
  status: BookingStatus;
  expires_at: number;
  pickup_lat: number | null;
  pickup_lng: number | null;
  pickup_message_id: number | null;
  offer_id: string | null;
  boarded_at: number | null;
  arrived_at: number | null;
  created_at: number;
  updated_at: number;
};

const toBooking = (row: Row): BookingRecord => ({
  id: row.id,
  tripId: row.trip_id,
  passengerId: row.passenger_id,
  seats: row.seats,
  price: row.price,
  commission: row.commission,
  status: row.status,
  expiresAt: row.expires_at,
  pickup:
    row.pickup_lat === null || row.pickup_lng === null ? null : { lat: row.pickup_lat, lng: row.pickup_lng },
  pickupMessageId: row.pickup_message_id,
  offerId: row.offer_id,
  boardedAt: row.boarded_at,
  arrivedAt: row.arrived_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const values = (b: BookingRecord) =>
  [
    b.tripId,
    b.passengerId,
    b.seats,
    b.price,
    b.commission,
    b.status,
    b.expiresAt,
    b.pickup?.lat ?? null,
    b.pickup?.lng ?? null,
    b.pickupMessageId,
    b.offerId,
    b.boardedAt,
    b.arrivedAt,
    b.createdAt,
    b.updatedAt,
  ] as const;

const UPSERT = `INSERT INTO bookings (trip_id, passenger_id, seats, price, commission, status, expires_at,
    pickup_lat, pickup_lng, pickup_message_id, offer_id, boarded_at, arrived_at, created_at, updated_at, id)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT (id) DO UPDATE SET status = excluded.status, pickup_lat = excluded.pickup_lat,
    pickup_lng = excluded.pickup_lng, pickup_message_id = excluded.pickup_message_id,
    boarded_at = excluded.boarded_at, arrived_at = excluded.arrived_at, updated_at = excluded.updated_at`;

const all = async (statement: D1PreparedStatement) => (await statement.all<Row>()).results.map(toBooking);

// Table bookings (migrations/0008_bookings_wallet.sql).
export const d1Bookings = (db: D1Database): BookingRepository => ({
  save: async (booking) => {
    await db
      .prepare(UPSERT)
      .bind(...values(booking), booking.id)
      .run();
  },
  replace: async (booking, expected) => {
    const result = await db
      .prepare('UPDATE bookings SET status = ?, updated_at = ? WHERE id = ? AND status = ?')
      .bind(booking.status, booking.updatedAt, booking.id, expected)
      .run();
    return result.meta.changes === 1;
  },
  find: async (id) => {
    const row = await db.prepare('SELECT * FROM bookings WHERE id = ?').bind(id).first<Row>();
    return row ? toBooking(row) : undefined;
  },
  byTrips: async (tripIds) =>
    tripIds.length === 0
      ? []
      : all(
          db
            .prepare(`SELECT * FROM bookings WHERE trip_id IN (${tripIds.map(() => '?').join(', ')})`)
            .bind(...tripIds),
        ),
  byPassenger: async (passengerId) =>
    all(db.prepare('SELECT * FROM bookings WHERE passenger_id = ?').bind(passengerId)),
  byPickupMessage: async (passengerId, messageId) => {
    const row = await db
      .prepare('SELECT * FROM bookings WHERE passenger_id = ? AND pickup_message_id = ?')
      .bind(passengerId, messageId)
      .first<Row>();
    return row ? toBooking(row) : undefined;
  },
  expireOver: async (now) => {
    await db
      .prepare(
        "UPDATE bookings SET status = 'expired', updated_at = ? WHERE status = 'requested' AND expires_at <= ?",
      )
      .bind(now, now)
      .run();
  },
});
