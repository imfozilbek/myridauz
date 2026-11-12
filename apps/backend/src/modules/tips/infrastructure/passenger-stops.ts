// The stops of a passenger (docs/232), each a read through indexes (docs/117, cron-reads.test.ts). Every
// statement binds the same values: ?1 … ?2 the window, ?3 now, ?4 the batch, ?5 a week ago.

// The person has tips on and had none this week (the domain checks again): a person told at 10:00
// does not take a place of the batch at 11:00.
export const stillOpen = (id: string) => `NOT EXISTS (SELECT 1 FROM tips_off o WHERE o.user_id = ${id})
  AND NOT EXISTS (SELECT 1 FROM tips p WHERE p.user_id = ${id} AND p.sent_at > ?5)`;

// ISO time of a bound moment: trip_views keeps its time so (migration 0049).
const iso = (bound: string) => `strftime('%Y-%m-%dT%H:%M:%fZ', ${bound} / 1000.0, 'unixepoch')`;

// P2: registered, then opened no trip, asked nothing, booked nothing, followed no route.
export const P2 = `SELECT u.id AS userId FROM users u
  WHERE u.created_at >= ?1 AND u.created_at < ?2
    AND NOT EXISTS (SELECT 1 FROM trip_views v WHERE v.user_id = CAST(u.id AS TEXT))
    AND NOT EXISTS (SELECT 1 FROM ride_requests r WHERE r.passenger_id = u.id)
    AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.passenger_id = u.id)
    AND NOT EXISTS (SELECT 1 FROM route_subscriptions s WHERE s.user_id = u.id)
    AND NOT EXISTS (SELECT 1 FROM driver_applications a WHERE a.user_id = u.id)
    AND ${stillOpen('u.id')}
  LIMIT ?4`;

// P3: opened a trip ahead that still has a free seat and booked nothing since.
const VIEWER = 'CAST(v.user_id AS INTEGER)';
export const P3 = `SELECT ${VIEWER} AS userId, t.id AS target FROM trips t
  JOIN trip_views v ON v.trip_id = t.id
  WHERE t.status = 'active' AND t.depart_at > ?3
    AND v.first_at >= ${iso('?1')} AND v.first_at < ${iso('?2')}
    AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.trip_id = t.id AND b.passenger_id = ${VIEWER})
    AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.passenger_id = ${VIEWER} AND b.created_at >= ?1)
    AND ${stillOpen(VIEWER)}
  LIMIT ?4`;

// P10: a ride ended, no booking after it; a trip of the same route is ahead (the tip says so).
export const P10 = `SELECT b.passenger_id AS userId, t.from_id AS fromId, t.to_id AS toId,
    (SELECT MIN(n.depart_at) FROM trips n
      WHERE n.from_id = t.from_id AND n.status = 'active' AND n.depart_at > ?3 AND n.to_id = t.to_id) AS nextAt
  FROM trips t JOIN bookings b ON b.trip_id = t.id AND b.status = 'completed'
  WHERE t.ends_at >= ?1 AND t.ends_at < ?2
    AND NOT EXISTS (SELECT 1 FROM bookings n WHERE n.passenger_id = b.passenger_id AND n.created_at > b.created_at)
    AND nextAt IS NOT NULL
    AND ${stillOpen('b.passenger_id')}
  LIMIT ?4`;

// A request still open without a single offer.
export const REQUEST = `SELECT r.passenger_id AS userId, r.id AS target FROM ride_requests r
  WHERE r.status = 'open' AND r.created_at >= ?1 AND r.created_at < ?2 AND r.expires_at > ?3
    AND NOT EXISTS (SELECT 1 FROM offers f WHERE f.request_id = r.id)
    AND ${stillOpen('r.passenger_id')}
  LIMIT ?4`;
