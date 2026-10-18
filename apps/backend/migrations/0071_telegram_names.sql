-- The public name (username) of the Telegram account of a person: the team sees it in the checks of
-- a face and of a driver application (owner, 17.10.2026). Never shown to other people (docs/07).
CREATE TABLE telegram_names (
  user_id INTEGER PRIMARY KEY,
  username TEXT,
  updated_at INTEGER NOT NULL
);
