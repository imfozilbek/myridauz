-- The welcomes of the passenger and the driver bot in every channel of the brand (owner, 18.10.2026,
-- docs/176): one row per channel and bot. A welcome counts as posted from the moment it is taken
-- (tried_at = posted_at); a post Telegram refused clears posted_at and is taken again an hour later.
-- message_id is the post in the channel, to find, change or delete it.
CREATE TABLE channel_welcomes (
  chat TEXT NOT NULL,
  role TEXT NOT NULL,
  tried_at INTEGER NOT NULL,
  posted_at INTEGER,
  message_id INTEGER,
  PRIMARY KEY (chat, role)
);
