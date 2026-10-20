-- G89 A5 (owner decision 20.10.2026): every case of «Navbat» (a complaint, a photo, a support
-- question) rings its member at 25 team minutes and the owners at 30, once per case and step; a new
-- case of the same person starts its own.
CREATE TABLE case_reminders (
  kind TEXT NOT NULL,
  case_id TEXT NOT NULL,
  since INTEGER NOT NULL,
  step TEXT NOT NULL,
  sent_at INTEGER NOT NULL,
  PRIMARY KEY (kind, case_id, since, step)
);
