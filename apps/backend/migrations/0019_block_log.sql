-- G20 (docs/65 A5): who blocked whom, when, until when and why. Rows are only added.
CREATE TABLE block_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  blocked_until INTEGER,
  blocked_by INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX block_log_user ON block_log (user_id, created_at);

-- The phone of a deleted account with an open complaint against it: a block decided later still
-- stops a new account with the same number. Removed when the complaint is resolved (docs/58).
CREATE TABLE held_phones (
  user_id INTEGER PRIMARY KEY,
  phone TEXT NOT NULL,
  held_at INTEGER NOT NULL
);
