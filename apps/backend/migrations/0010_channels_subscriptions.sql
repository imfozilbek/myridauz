-- G10: channel posts of trips (docs/15), route subscriptions (docs/24), trip reminders.

-- The post of a trip in a channel: edited when seats are taken or the trip is cancelled.
CREATE TABLE channel_posts (
  trip_id TEXT NOT NULL,
  channel TEXT NOT NULL,
  message_id INTEGER NOT NULL,
  PRIMARY KEY (trip_id, channel)
);
