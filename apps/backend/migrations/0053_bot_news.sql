-- G68 (docs/122 rule 4): the new trips or requests of a route come in one card a day; a new one
-- edits the card. item: the trip or request; line: how the card shows it; sort: its place in the
-- list (the time of the trip, the day of the request).
CREATE TABLE bot_news (
  bot TEXT NOT NULL,
  chat_id INTEGER NOT NULL,
  card TEXT NOT NULL,
  item TEXT NOT NULL,
  line TEXT NOT NULL,
  sort INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (bot, chat_id, card, item)
);
-- A deleted account takes its news with it (docs/30).
CREATE INDEX bot_news_chat ON bot_news (chat_id);
-- The news of past days are forgotten by the Cron.
CREATE INDEX bot_news_old ON bot_news (created_at);
-- The pause of 10 minutes between subscription messages is gone: the card of the day takes its
-- place. Nothing reads pending now; its columns stay, the worker before this deploy still writes them.
DROP INDEX route_subscriptions_pending;
