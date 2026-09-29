import type { NumbersSource } from '../application/ports';

// The main numbers of a period, straight from the tables (docs/29).
const SQL = `SELECT
  (SELECT COUNT(*) FROM users WHERE created_at >= ?1) AS newUsers,
  (SELECT COUNT(*) FROM trips WHERE created_at >= ?1) AS trips,
  (SELECT COUNT(*) FROM bookings WHERE created_at >= ?1) AS bookings,
  (SELECT COUNT(*) FROM driver_applications WHERE submitted_at >= ?1) AS driverApplications,
  (SELECT COUNT(*) FROM complaints WHERE created_at >= ?1) AS complaints`;

type Row = {
  newUsers: number;
  trips: number;
  bookings: number;
  driverApplications: number;
  complaints: number;
};

export const d1Numbers = (db: D1Database): NumbersSource => ({
  numbers: async (since) => {
    const row = await db.prepare(SQL).bind(since).first<Row>();
    return {
      newUsers: row?.newUsers ?? 0,
      trips: row?.trips ?? 0,
      bookings: row?.bookings ?? 0,
      driverApplications: row?.driverApplications ?? 0,
      complaints: row?.complaints ?? 0,
    };
  },
});
