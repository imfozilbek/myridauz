-- G55: where a person came from and on what, kept once at the registration (docs/116). Marks and
-- names only: the kind of the link, the mark of its source, the Telegram app and its engine.
CREATE TABLE user_arrivals (
  user_id INTEGER PRIMARY KEY,
  source TEXT,
  via TEXT,
  client TEXT,
  arrived_at INTEGER NOT NULL
);
CREATE INDEX user_arrivals_at ON user_arrivals (arrived_at);
