-- G58 (docs/118, G51): every new face photo waits for the team. Until it is approved only its owner
-- sees it. Photos people have now were seen by the team already: they stay shown.
ALTER TABLE users ADD COLUMN avatar_status TEXT CHECK (avatar_status IN ('pending', 'approved', 'rejected'));
ALTER TABLE users ADD COLUMN avatar_reason TEXT;
ALTER TABLE users ADD COLUMN avatar_at INTEGER;
UPDATE users SET avatar_status = 'approved', avatar_at = updated_at WHERE avatar_key IS NOT NULL;
-- The queue of new photos, the oldest first, without reading every person (G56, docs/117).
CREATE INDEX users_avatar_status ON users (avatar_status, avatar_at);

-- Every decision of the team on a face photo; rows are only added (like application_log).
CREATE TABLE face_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  reason TEXT,
  decided_by INTEGER NOT NULL,
  decided_at INTEGER NOT NULL
);
CREATE INDEX face_log_user ON face_log (user_id);

-- G58 (docs/119 row 6): the passenger bot invites a person to the channel of their zone once.
ALTER TABLE users ADD COLUMN zone_invite_at INTEGER;
