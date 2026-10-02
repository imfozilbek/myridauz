-- G31 (docs/92): who of the team got a question of the support bot or a driver application.
-- One row per person (or applicant) and Tashkent day: the same day goes to the same member.
CREATE TABLE assignments (
  kind TEXT NOT NULL,
  subject_id INTEGER NOT NULL,
  day TEXT NOT NULL,
  assignee_id INTEGER NOT NULL,
  assigned_at INTEGER NOT NULL,
  answered_at INTEGER,
  PRIMARY KEY (kind, subject_id, day)
);
CREATE INDEX assignments_day ON assignments (day);

-- The daily digest went out for this day: once a day, a missed Cron tick catches up.
CREATE TABLE team_digests (
  day TEXT PRIMARY KEY,
  sent_at INTEGER NOT NULL
);
