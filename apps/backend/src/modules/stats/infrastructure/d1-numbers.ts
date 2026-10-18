import type { NumbersSource } from '../application/ports';
import type { MarkCount } from '../domain/rost';
import type { ArrivalCount } from '../domain/arrivals';

// The main numbers of a period, straight from the tables (docs/29).
const SQL = `SELECT
  (SELECT COUNT(*) FROM users WHERE created_at >= ?1) AS newUsers,
  (SELECT COUNT(*) FROM trips WHERE created_at >= ?1) AS trips,
  (SELECT COUNT(*) FROM trips WHERE status IN ('active', 'full') AND depart_at > ?2
    AND departed_at IS NULL) AS activeTrips,
  (SELECT COUNT(*) FROM bookings WHERE created_at >= ?1) AS bookings,
  (SELECT COUNT(*) FROM driver_applications WHERE submitted_at >= ?1) AS driverApplications,
  (SELECT COUNT(*) FROM complaints WHERE created_at >= ?1) AS complaints`;

const RIDERS = `SELECT a.via AS via, COUNT(*) AS count FROM user_arrivals a
  WHERE a.arrived_at >= ? AND a.via IS NOT NULL AND (
    EXISTS (SELECT 1 FROM bookings b WHERE b.passenger_id = a.user_id AND b.status = 'completed'
      AND b.no_show_at IS NULL)
    OR EXISTS (SELECT 1 FROM trips t WHERE t.driver_id = a.user_id AND t.status = 'completed'))
  GROUP BY a.via`;

// The reviews of a period through reviews_created (migration 0074), their tags from the JSON list,
// the reasons of the complaints through complaints_created (G87 V2).
const REVIEWS = `SELECT COUNT(*) AS reviews, COALESCE(SUM(stars), 0) AS starsSum,
  COALESCE(SUM(stars <= 2), 0) AS low FROM reviews WHERE created_at >= ?`;
const TAGS = `SELECT j.value AS tag, COUNT(*) AS count FROM reviews r, json_each(r.tags) j
  WHERE r.created_at >= ? GROUP BY j.value`;
const REASONS = 'SELECT reason FROM complaints WHERE created_at >= ?';

type Row = {
  newUsers: number;
  trips: number;
  activeTrips: number;
  bookings: number;
  driverApplications: number;
  complaints: number;
};

export const d1Numbers = (db: D1Database): NumbersSource => ({
  numbers: async (since) => {
    // Live now: the trips that have not left yet, by the clock or by «Yoʻlga chiqdim» (G63).
    const row = await db.prepare(SQL).bind(since, Date.now()).first<Row>();
    return {
      newUsers: row?.newUsers ?? 0,
      trips: row?.trips ?? 0,
      activeTrips: row?.activeTrips ?? 0,
      bookings: row?.bookings ?? 0,
      driverApplications: row?.driverApplications ?? 0,
      complaints: row?.complaints ?? 0,
    };
  },
  // The first touch of the new people (G55, docs/116): a deleted account takes its row with it.
  arrivals: async (since) => {
    const { results } = await db
      .prepare(
        `SELECT via, client, COUNT(*) AS count FROM user_arrivals WHERE arrived_at >= ? GROUP BY via, client`,
      )
      .bind(since)
      .all<ArrivalCount>();
    return results;
  },
  // The new people of a mark who rode (G69, docs/123): through the index of the arrival time.
  riders: async (since) => {
    const { results } = await db.prepare(RIDERS).bind(since).all<MarkCount>();
    return results;
  },
  feelings: async (since) => {
    const [reviews, tags, reasons] = await Promise.all([
      db.prepare(REVIEWS).bind(since).first<{ reviews: number; starsSum: number; low: number }>(),
      db.prepare(TAGS).bind(since).all<{ tag: string; count: number }>(),
      db.prepare(REASONS).bind(since).all<{ reason: string }>(),
    ]);
    return {
      reviews: reviews?.reviews ?? 0,
      starsSum: reviews?.starsSum ?? 0,
      low: reviews?.low ?? 0,
      tags: tags.results,
      reasons: reasons.results.map((row) => row.reason),
    };
  },
});
