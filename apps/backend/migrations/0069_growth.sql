-- G69: the short code of a person for the links they share, and who brought whom (docs/123, 116).
-- Only the code goes into a link, never the id.
CREATE TABLE user_codes (
  user_id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE
);
ALTER TABLE user_arrivals ADD COLUMN inviter_id INTEGER;
CREATE INDEX user_arrivals_inviter ON user_arrivals (inviter_id);

-- The moments of «Men Rida bilan» a person was offered: each one once, never forced (docs/123).
CREATE TABLE share_moments (
  user_id INTEGER NOT NULL,
  moment TEXT NOT NULL,
  at INTEGER NOT NULL,
  PRIMARY KEY (user_id, moment)
);
