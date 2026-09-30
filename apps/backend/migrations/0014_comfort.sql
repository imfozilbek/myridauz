-- G18: "Sevimli haydovchilar" and the driver's "Yaqinlarimga yuborish" (docs/18, docs/43).

-- A passenger saves a driver: the bot tells the passenger about the driver's new trips.
CREATE TABLE favorite_drivers (
  passenger_id INTEGER NOT NULL REFERENCES users (id),
  driver_id INTEGER NOT NULL REFERENCES users (id),
  created_at INTEGER NOT NULL,
  PRIMARY KEY (passenger_id, driver_id)
);
CREATE INDEX favorite_drivers_driver ON favorite_drivers (driver_id);

-- The driver's own trip shared with the family: only a hash of the link token is kept.
CREATE TABLE driver_trip_shares (
  token_hash TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL REFERENCES trips (id),
  created_at INTEGER NOT NULL,
  revoked_at INTEGER
);
CREATE INDEX driver_trip_shares_trip ON driver_trip_shares (trip_id);

-- The close people of the driver who asked for bot messages: at most 5 per trip.
CREATE TABLE driver_share_followers (
  trip_id TEXT NOT NULL REFERENCES trips (id),
  telegram_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (trip_id, telegram_id)
);
