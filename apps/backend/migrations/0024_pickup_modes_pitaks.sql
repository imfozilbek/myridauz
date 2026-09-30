-- G24 (docs/70, docs/72): how a passenger is picked up and where they go, and the pitaks.
-- A trip and a request say which ways of pickup suit them: from a pitak, from the door or both.
ALTER TABLE trips ADD COLUMN pickup_mode TEXT NOT NULL DEFAULT 'both'
  CHECK (pickup_mode IN ('pitak', 'door', 'both'));
ALTER TABLE ride_requests ADD COLUMN pickup_mode TEXT NOT NULL DEFAULT 'both'
  CHECK (pickup_mode IN ('pitak', 'door', 'both'));

-- A booking keeps the one way chosen at the booking and never changes it. The points and their
-- names (JSON of the ladder, docs/69) are erased: at a cancel, at the deletion of the account and
-- 30 days after the trip (after the decision when a complaint is open). The pitak is public.
ALTER TABLE bookings ADD COLUMN pickup_mode TEXT CHECK (pickup_mode IN ('pitak', 'door'));
ALTER TABLE bookings ADD COLUMN pitak_id TEXT;
ALTER TABLE bookings ADD COLUMN pickup_name TEXT;
ALTER TABLE bookings ADD COLUMN dropoff_lat REAL;
ALTER TABLE bookings ADD COLUMN dropoff_lng REAL;
ALTER TABLE bookings ADD COLUMN dropoff_name TEXT;
ALTER TABLE ride_requests ADD COLUMN pickup_lat REAL;
ALTER TABLE ride_requests ADD COLUMN pickup_lng REAL;
ALTER TABLE ride_requests ADD COLUMN pickup_name TEXT;
ALTER TABLE ride_requests ADD COLUMN dropoff_lat REAL;
ALTER TABLE ride_requests ADD COLUMN dropoff_lng REAL;
ALTER TABLE ride_requests ADD COLUMN dropoff_name TEXT;
-- The Cron job finds the old bookings that still keep points without reading the others.
CREATE INDEX bookings_points ON bookings (created_at)
  WHERE pickup_lat IS NOT NULL OR dropoff_lat IS NOT NULL;

-- A pitak: a place where cars wait for people to one direction. The region comes from the point.
-- Only «claude» (chosen by Claude) and «checked» (checked by people) are shown to people.
CREATE TABLE pitaks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  region_id TEXT NOT NULL REFERENCES locations (id),
  status TEXT NOT NULL CHECK (status IN ('candidate', 'claude', 'checked', 'closed')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- The live directions «region A → region B» (Toshkent shahri is its own region) and the main pitak
-- of each: the system takes it by itself, nobody chooses it (owner decision 30.09.2026).
CREATE TABLE pitak_directions (
  from_region TEXT NOT NULL REFERENCES locations (id),
  to_region TEXT NOT NULL REFERENCES locations (id),
  pitak_id TEXT REFERENCES pitaks (id),
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (from_region, to_region)
);

-- Every change of a pitak or a direction, as for prices (docs/23): who, when, before and after.
CREATE TABLE pitak_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject TEXT NOT NULL,
  before TEXT,
  after TEXT,
  by_user INTEGER NOT NULL,
  at INTEGER NOT NULL
);
CREATE INDEX pitak_log_subject ON pitak_log (subject, at);
