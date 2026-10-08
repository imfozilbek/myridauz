import type { NumbersSource } from '../application/ports';
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
});
