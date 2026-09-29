-- G08: bookings, drivers' offers on requests and the drivers' wallet (docs/12, docs/35).
CREATE TABLE bookings (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL REFERENCES trips (id),
  passenger_id INTEGER NOT NULL REFERENCES users (id),
  seats INTEGER NOT NULL CHECK (seats BETWEEN 1 AND 7),
  -- The price per seat and the commission as they were at the request: later changes do not touch them.
  price INTEGER NOT NULL CHECK (price > 0),
  commission INTEGER NOT NULL CHECK (commission >= 0),
  status TEXT NOT NULL CHECK (
    status IN (
      'requested', 'confirmed', 'completed', 'declined', 'expired',
      'cancelled_by_passenger', 'cancelled_by_driver'
    )
  ),
  expires_at INTEGER NOT NULL,
  -- The passenger's own pickup point, sent to the passenger bot after the confirmation (docs/14).
  pickup_lat REAL,
  pickup_lng REAL,
  pickup_message_id INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX bookings_trip ON bookings (trip_id);
CREATE INDEX bookings_passenger ON bookings (passenger_id, status);
CREATE INDEX bookings_status ON bookings (status, expires_at);

CREATE TABLE offers (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES ride_requests (id),
  driver_id INTEGER NOT NULL REFERENCES users (id),
  depart_at INTEGER NOT NULL,
  price INTEGER NOT NULL CHECK (price > 0),
  status TEXT NOT NULL CHECK (status IN ('sent', 'accepted', 'declined', 'expired')),
  booking_id TEXT REFERENCES bookings (id),
  created_at INTEGER NOT NULL
);
CREATE INDEX offers_request ON offers (request_id);
CREATE INDEX offers_driver ON offers (driver_id);

-- Append-only: rows are never changed or deleted. A balance is the sum of its rows (docs/12).
CREATE TABLE wallet_operations (
  id TEXT PRIMARY KEY,
  driver_id INTEGER NOT NULL REFERENCES users (id),
  kind TEXT NOT NULL CHECK (
    kind IN ('bonus_grant', 'bonus_expired', 'commission', 'refund', 'admin_adjustment')
  ),
  balance TEXT NOT NULL CHECK (balance IN ('bonus', 'main')),
  amount INTEGER NOT NULL,
  booking_id TEXT,
  reason TEXT,
  created_by INTEGER,
  -- A bonus grant lives until this time (docs/12).
  expires_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX wallet_driver ON wallet_operations (driver_id, created_at);
-- One commission and one refund per booking and balance: two confirmations at once cannot charge twice.
CREATE UNIQUE INDEX wallet_once ON wallet_operations (booking_id, kind, balance)
  WHERE booking_id IS NOT NULL;
