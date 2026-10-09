-- G68 (docs/122 rule 1): the live cards of the bots. One card per thing a person follows (a trip, a
-- request, the new trips of a day), edited without sound when the thing changes. message_id: the
-- card in the chat with the bot; hash: what it shows, so the same card is not edited again; pinned:
-- on top of the chat while the trip is ahead (rule 6).
CREATE TABLE bot_cards (
  bot TEXT NOT NULL,
  chat_id INTEGER NOT NULL,
  card TEXT NOT NULL,
  message_id INTEGER NOT NULL,
  hash TEXT NOT NULL,
  pinned INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (bot, chat_id, card)
);
-- A deleted account takes its cards with it (docs/30).
CREATE INDEX bot_cards_chat ON bot_cards (chat_id);
-- Cards nobody changed for a long time are forgotten by the Cron.
CREATE INDEX bot_cards_old ON bot_cards (updated_at);
