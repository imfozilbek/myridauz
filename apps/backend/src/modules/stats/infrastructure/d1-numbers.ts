import type { NumbersSource } from '../application/ports';
import type { MarkCount } from '../domain/rost';
import type { ArrivalCount } from '../domain/arrivals';
import { d1Voice } from './d1-voice';

// The main numbers of a period, straight from the tables (docs/29).
const SQL = `SELECT
  (SELECT COUNT(*) FROM users WHERE created_at >= ?1) AS newUsers,
  (SELECT COUNT(*) FROM trips WHERE created_at >= ?1) AS trips,
  (SELECT COUNT(*) FROM trips WHERE status IN ('active', 'full') AND depart_at > ?2
    AND departed_at IS NULL) AS activeTrips,
  (SELECT COUNT(*) FROM bookings WHERE created_at >= ?1) AS bookings,
  (SELECT COUNT(*) FROM driver_applications WHERE submitted_at >= ?1) AS driverApplications,
  (SELECT COUNT(*) FROM complaints WHERE created_at >= ?1) AS complaints`;

// The same counts over [since, until): the period before, to compare (G45, F-A12 of docs/90).
const BEFORE = `SELECT
  (SELECT COUNT(*) FROM users WHERE created_at >= ?1 AND created_at < ?2) AS newUsers,
  (SELECT COUNT(*) FROM trips WHERE created_at >= ?1 AND created_at < ?2) AS trips,
  (SELECT COUNT(*) FROM bookings WHERE created_at >= ?1 AND created_at < ?2) AS bookings,
  (SELECT COUNT(*) FROM driver_applications WHERE submitted_at >= ?1 AND submitted_at < ?2)
    AS driverApplications,
  (SELECT COUNT(*) FROM complaints WHERE created_at >= ?1 AND created_at < ?2) AS complaints`;

const RIDERS = `SELECT a.via AS via, COUNT(*) AS count FROM user_arrivals a
  WHERE a.arrived_at >= ? AND a.via IS NOT NULL AND (
    EXISTS (SELECT 1 FROM bookings b WHERE b.passenger_id = a.user_id AND b.status = 'completed'
      AND b.no_show_at IS NULL)
    OR EXISTS (SELECT 1 FROM trips t WHERE t.driver_id = a.user_id AND t.status = 'completed'))
  GROUP BY a.via`;

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
  before: async (since, until) => {
    const row = await db.prepare(BEFORE).bind(since, until).first<Omit<Row, 'activeTrips'>>();
    return {
      newUsers: row?.newUsers ?? 0,
      trips: row?.trips ?? 0,
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
  voice: d1Voice(db),
});
