-- The welcomes of the passenger and the driver bot in every channel of the brand (owner, 18.10.2026,
-- docs/176): one row per channel and bot. tried_at is when the post was taken, posted_at when
-- Telegram took it; a refused one is taken again an hour later.
CREATE TABLE channel_welcomes (
  chat TEXT NOT NULL,
  role TEXT NOT NULL,
  tried_at INTEGER NOT NULL,
  posted_at INTEGER,
  PRIMARY KEY (chat, role)
);
