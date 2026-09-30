-- Channels the team adds in the admin (docs/63): a district channel covers a list of places.
-- The 13 region channels stay in the brand config (docs/15).
CREATE TABLE team_channels (
  username TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  places TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
