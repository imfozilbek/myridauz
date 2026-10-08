-- The driver at the point of the passenger (docs/126, G63): «Men keldim», then «Keldi» or «Kelmadi».
-- Times like came_at (0044): the statuses of a booking stay as they are.
ALTER TABLE bookings ADD COLUMN driver_came_at INTEGER;
ALTER TABLE bookings ADD COLUMN met_at INTEGER;
ALTER TABLE bookings ADD COLUMN no_show_at INTEGER;
