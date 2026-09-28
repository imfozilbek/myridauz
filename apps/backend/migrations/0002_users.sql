-- G04: users. One record per person for all bots (docs/02); id is the Telegram user id.
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  first_name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  phone TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'uz-Latn',
  is_driver INTEGER NOT NULL DEFAULT 0,
  consent_at INTEGER NOT NULL,
  blocked INTEGER NOT NULL DEFAULT 0,
  -- epoch ms; NULL with blocked = 1 means blocked for good (docs/17).
  blocked_until INTEGER,
  avatar_key TEXT,
  write_access INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX users_phone ON users (phone);

-- A block by phone stops a new account with the same number (docs/17). Filled by moderation (G11).
CREATE TABLE blocked_phones (
  phone TEXT PRIMARY KEY,
  blocked_until INTEGER,
  created_at INTEGER NOT NULL
);
