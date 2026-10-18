-- The welcomes of the passenger and the driver bot in every channel of the brand (owner, 18.10.2026,
-- docs/176): one row per channel and bot. A welcome is posted only when Telegram gave message_id,
-- the post in the channel (to find, change or delete it); posted_at is when. Any other end is taken
-- again an hour after tried_at.
CREATE TABLE channel_welcomes (
  chat TEXT NOT NULL,
  role TEXT NOT NULL,
  tried_at INTEGER NOT NULL,
  posted_at INTEGER,
  message_id INTEGER,
  PRIMARY KEY (chat, role)
);
