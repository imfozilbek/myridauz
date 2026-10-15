import type { Ride, Side } from '../application/ports';

// A ride that happened (docs/129): a completed seat the driver did not mark as a no-show.
const RODE = "b.status = 'completed' AND b.no_show_at IS NULL";
const COLUMNS = 't.id AS tripId, t.from_id AS "from", t.to_id AS "to", t.depart_at AS departAt';
const SQL: Record<Side, string> = {
  passenger:
    `SELECT ${COLUMNS}, b.seats FROM bookings b JOIN trips t ON t.id = b.trip_id ` +
    `WHERE b.passenger_id = ? AND ${RODE}`,
  // A driver's trip driven to its end with the people it brought: an empty trip brings nobody.
  driver:
    `SELECT ${COLUMNS}, (SELECT COALESCE(SUM(b.seats), 0) FROM bookings b WHERE b.trip_id = t.id AND ${RODE}) ` +
    "AS seats FROM trips t WHERE t.driver_id = ? AND t.status = 'completed'",
};

// The rides of a person on one side, read once for a moment (G69, docs/123).
export const d1Rides =
  (db: D1Database) =>
  async (userId: number, side: Side): Promise<Ride[]> =>
    (await db.prepare(SQL[side]).bind(userId).all<Ride>()).results;
