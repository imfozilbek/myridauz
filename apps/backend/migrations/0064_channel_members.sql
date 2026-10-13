-- Who is in which channel of the brand (G80, docs/176): the bot of the posts hears every join and
-- leave (chat_member), so «Kanallar» reads one table instead of asking Telegram 67 times.
CREATE TABLE channel_members (
  chat TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  member INTEGER NOT NULL,
  at INTEGER NOT NULL,
  PRIMARY KEY (chat, user_id)
) WITHOUT ROWID;

CREATE INDEX channel_members_user ON channel_members (user_id);
