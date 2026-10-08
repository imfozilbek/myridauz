-- G63: «Yoʻlga chiqdim» and «Yetib keldik» of the driver (docs/35, owner decision 06.10.2026).
-- Not new statuses: the CHECK of trips.status stays; two marks in milliseconds, as boarded_at and
-- arrived_at of bookings (migration 0009). The Cron reads them through trips_search (0007).
ALTER TABLE trips ADD COLUMN departed_at INTEGER;
ALTER TABLE trips ADD COLUMN arrived_at INTEGER;
