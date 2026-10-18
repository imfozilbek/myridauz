-- The people who blocked a bot (G46, docs/191): Telegram answered 403 or said «kicked». The bot sends
-- them nothing until they come back with /start.
CREATE TABLE bot_blocks (
  bot TEXT NOT NULL,
  chat_id INTEGER NOT NULL,
  blocked_at INTEGER NOT NULL,
  PRIMARY KEY (chat_id, bot)
);
