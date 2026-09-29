-- G07: trips of drivers and ride requests of passengers (docs/09, docs/35).
CREATE TABLE trips (
  id TEXT PRIMARY KEY,
  driver_id INTEGER NOT NULL REFERENCES users (id),
  from_id TEXT NOT NULL REFERENCES locations (id),
  to_id TEXT NOT NULL REFERENCES locations (id),
  depart_at INTEGER NOT NULL,
  ends_at INTEGER NOT NULL,
  km INTEGER NOT NULL,
  seats INTEGER NOT NULL CHECK (seats BETWEEN 1 AND 7),
  price INTEGER NOT NULL CHECK (price > 0),
  woman_on_board INTEGER NOT NULL DEFAULT 0,
  comment TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('active', 'full', 'completed', 'cancelled')),
  meeting_lat REAL,
  meeting_lng REAL,
  created_at INTEGER NOT NULL
);
CREATE INDEX trips_search ON trips (status, depart_at);
CREATE INDEX trips_driver ON trips (driver_id);

CREATE TABLE ride_requests (
  id TEXT PRIMARY KEY,
  passenger_id INTEGER NOT NULL REFERENCES users (id),
  from_id TEXT NOT NULL REFERENCES locations (id),
  to_id TEXT NOT NULL REFERENCES locations (id),
  date TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  km INTEGER NOT NULL,
  seats INTEGER NOT NULL CHECK (seats BETWEEN 1 AND 4),
  price INTEGER NOT NULL CHECK (price > 0),
  status TEXT NOT NULL CHECK (status IN ('open', 'matched', 'expired', 'cancelled')),
  created_at INTEGER NOT NULL
);
CREATE INDEX ride_requests_search ON ride_requests (status, date);
CREATE INDEX ride_requests_passenger ON ride_requests (passenger_id);
