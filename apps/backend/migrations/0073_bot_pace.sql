-- The pace of the bots (G85, docs/122). A bot Telegram answered 429 waits as a whole until `until`
-- (T4); a channel takes 18 new posts a minute, the next ones wait for a later minute (T7).
CREATE TABLE bot_pauses (
  bot TEXT PRIMARY KEY,
  until INTEGER NOT NULL
);
CREATE TABLE chat_pace (
  chat TEXT NOT NULL,
  minute INTEGER NOT NULL,
  sent INTEGER NOT NULL,
  PRIMARY KEY (chat, minute)
);
