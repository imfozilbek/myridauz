import type { ServerStep } from '../domain/path-events';

// G99 (docs/234): the steps only the server sees, once per person, with their first touch. The
// public id only, never the Telegram ID (docs/29). «+column» keeps the index of the time, not of the
// person, so a period reads only its own rows (docs/117).
const STEPS = `SELECT u.public_id AS who, COALESCE(a.via, a.source) AS entry, a.client AS client,
    s.step AS step, s.at AS at
  FROM (
    SELECT user_id AS uid, 'approved' AS step, updated_at AS at FROM driver_applications
      WHERE status = 'approved' AND updated_at >= ?1
    UNION ALL
    SELECT t.driver_id, 'first_booking', MIN(b.confirmed_at) FROM bookings b JOIN trips t ON t.id = b.trip_id
      WHERE b.confirmed_at > 0 GROUP BY t.driver_id HAVING MIN(b.confirmed_at) >= ?1
    UNION ALL
    SELECT driver_id, 'trip_done', MIN(ends_at) FROM trips WHERE status = 'completed' AND ends_at >= ?1
      GROUP BY +driver_id
    UNION ALL
    SELECT passenger_id, 'confirmed', MIN(confirmed_at) FROM bookings WHERE confirmed_at >= ?1
      GROUP BY +passenger_id
    UNION ALL
    SELECT passenger_id, 'rode', MIN(boarded_at) FROM bookings WHERE boarded_at >= ?1 GROUP BY +passenger_id
  ) s
  JOIN users u ON u.id = s.uid
  LEFT JOIN user_arrivals a ON a.user_id = s.uid`;

export const d1PathSteps = (db: D1Database) => async (since: number) =>
  (await db.prepare(STEPS).bind(since).all<ServerStep>()).results;
