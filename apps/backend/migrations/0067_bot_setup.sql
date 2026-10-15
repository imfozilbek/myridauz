-- G83: the mark of the last setup of the bots. The Cron sets the bots up again by itself when the
-- mark of the tokens and texts differs (a new bot, a new text), no command from a computer.
CREATE TABLE bot_setup (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  stamp TEXT NOT NULL,
  done_at INTEGER NOT NULL
);
