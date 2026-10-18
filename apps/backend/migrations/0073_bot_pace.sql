-- The pace of the bots (G85, docs/122). A bot Telegram answered 429 waits as a whole until `until`
-- (T4); a channel takes the next post not before `next_at`, 18 posts a minute at most (T7).
CREATE TABLE bot_pauses (
  bot TEXT PRIMARY KEY,
  until INTEGER NOT NULL
);
CREATE TABLE chat_pace (
  chat TEXT PRIMARY KEY,
  next_at INTEGER NOT NULL
);
