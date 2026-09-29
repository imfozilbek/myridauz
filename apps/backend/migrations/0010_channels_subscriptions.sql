-- G10: channel posts of trips (docs/15), route subscriptions (docs/24), trip reminders.

-- The post of a trip in a channel: edited when seats are taken or the trip is cancelled.
CREATE TABLE channel_posts (
  trip_id TEXT NOT NULL,
  channel TEXT NOT NULL,
  message_id INTEGER NOT NULL,
  PRIMARY KEY (trip_id, channel)
);

-- Route subscriptions (docs/24): kind "trips" for passengers, "requests" for drivers.
CREATE TABLE route_subscriptions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('trips', 'requests')),
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  date TEXT,
  woman INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER NOT NULL,
  expired INTEGER NOT NULL DEFAULT 0,
  last_sent_at INTEGER,
  pending INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX route_subscriptions_user ON route_subscriptions (user_id, kind);
CREATE INDEX route_subscriptions_live ON route_subscriptions (kind, expired, expires_at);
