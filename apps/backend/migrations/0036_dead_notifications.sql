-- Bot messages Telegram never took after the last try of the queue (G42, docs/111, docs/65 D):
-- kept 30 days for the team, then removed.
CREATE TABLE dead_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bot TEXT NOT NULL,
  chat_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  reason TEXT NOT NULL,
  at INTEGER NOT NULL
);
CREATE INDEX dead_notifications_at ON dead_notifications (at);
