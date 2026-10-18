-- G87 (docs/191): the life of each channel by day of Tashkent: how many people joined and left, and
-- how many it had at the hourly check. Counts only, never who.
CREATE TABLE channel_days (
  day TEXT NOT NULL,
  chat TEXT NOT NULL,
  joined INTEGER NOT NULL DEFAULT 0,
  gone INTEGER NOT NULL DEFAULT 0,
  subscribers INTEGER,
  PRIMARY KEY (day, chat)
) WITHOUT ROWID;

-- The reactions of each post of a channel (G87): Telegram sends their count when it changes. at: the
-- time of the last change.
CREATE TABLE post_reactions (
  chat TEXT NOT NULL,
  message_id INTEGER NOT NULL,
  reactions INTEGER NOT NULL,
  at INTEGER NOT NULL,
  PRIMARY KEY (chat, message_id)
) WITHOUT ROWID;

CREATE INDEX post_reactions_at ON post_reactions (at);
