-- G70a (owner, 12.11.2026, docs/232): the tips of a step the bots sent, one row a tip. A small
-- journal: at most 2 tips of a step and 1 a week for a person. A deleted account takes its rows (docs/30).
CREATE TABLE tips (
  user_id INTEGER NOT NULL,
  step TEXT NOT NULL,
  sent_at INTEGER NOT NULL
);
-- The tips of the people of one run (the limits), and the tips of a period for «Rost».
CREATE INDEX tips_user ON tips (user_id, sent_at);
CREATE INDEX tips_sent ON tips (sent_at);
-- «Kerak emas» under a tip: no more tips for the person, the other messages stay.
CREATE TABLE tips_off (
  user_id INTEGER PRIMARY KEY,
  off_at INTEGER NOT NULL
);
-- The drafts of driver applications by their last change: «Arizani davom ettirish» reads only the
-- drafts of a day (docs/117).
CREATE INDEX driver_applications_updated ON driver_applications (status, updated_at);
