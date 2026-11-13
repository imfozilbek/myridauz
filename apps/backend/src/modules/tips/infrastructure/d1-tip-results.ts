import { HOUR_MS, type TipStep } from '@platform/contracts';

// A tip worked when the person did the step within 72 h after it (docs/123 §3), by the tables of D1,
// not by the analytics (docs/232).
const DONE_MS = 72 * HOUR_MS;
const AFTER = (column: string) => `${column} > p.sent_at AND ${column} <= p.sent_at + ${DONE_MS}`;
const ISO = (bound: string) => `strftime('%Y-%m-%dT%H:%M:%fZ', ${bound} / 1000.0, 'unixepoch')`;

const BOOKED = `EXISTS (SELECT 1 FROM bookings b WHERE b.passenger_id = p.user_id AND ${AFTER('b.created_at')})`;
const PUBLISHED = `EXISTS (SELECT 1 FROM trips t WHERE t.driver_id = p.user_id AND ${AFTER('t.created_at')})`;
// P2: opened a trip, asked or booked; P3, P10: booked; a request: an offer came; D1: the application
// went; D2, D4: a trip published; D7: a booking on a trip of the driver.
const DONE = `CASE p.step
  WHEN 'p2' THEN ${BOOKED}
    OR EXISTS (SELECT 1 FROM trip_views v WHERE v.user_id = CAST(p.user_id AS TEXT)
      AND v.first_at > ${ISO('p.sent_at')} AND v.first_at <= ${ISO(`(p.sent_at + ${DONE_MS})`)})
    OR EXISTS (SELECT 1 FROM ride_requests r WHERE r.passenger_id = p.user_id AND ${AFTER('r.created_at')})
  WHEN 'p3' THEN ${BOOKED}
  WHEN 'p10' THEN ${BOOKED}
  WHEN 'req' THEN EXISTS (SELECT 1 FROM ride_requests r JOIN offers f ON f.request_id = r.id
    WHERE r.passenger_id = p.user_id AND ${AFTER('f.created_at')})
  WHEN 'd1' THEN EXISTS (SELECT 1 FROM driver_applications a WHERE a.user_id = p.user_id
    AND ${AFTER('a.submitted_at')})
  WHEN 'd7' THEN EXISTS (SELECT 1 FROM trips t JOIN bookings b ON b.trip_id = t.id
    WHERE t.driver_id = p.user_id AND ${AFTER('b.created_at')})
  ELSE ${PUBLISHED} END`;
const RESULTS = `SELECT p.step AS step, COUNT(*) AS sent, SUM(${DONE}) AS done FROM tips p
  WHERE p.sent_at >= ?1 GROUP BY p.step`;

export type TipResult = { readonly step: TipStep; readonly sent: number; readonly done: number };

// The tips sent since a moment by step, and how many of them worked («Rost», G70a).
export async function d1TipResults(db: D1Database, since: number): Promise<TipResult[]> {
  const { results } = await db.prepare(RESULTS).bind(since).all<TipResult>();
  return results.map((row) => ({ step: row.step, sent: row.sent, done: row.done ?? 0 }));
}
