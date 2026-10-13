-- G82 (docs/180): the look of the bots and the channels comes from the repository. One row a bot or
-- a channel: when the Worker last checked it, and the avatar it gave or took: the hash of the file of
-- the repository and the photo Telegram made of it (Telegram makes its own file, the two never compare).
CREATE TABLE looks (
  face TEXT PRIMARY KEY,
  checked_at INTEGER NOT NULL,
  picture_hash TEXT,
  photo_id TEXT
);
