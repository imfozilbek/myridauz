-- G54: the sound set of the Mini Apps (docs/115). The owner picks one in the admin Mini App; every
-- pick is a new row, so the history keeps who and when. No start row: the brand default plays.
CREATE TABLE sound_choices (
  version INTEGER PRIMARY KEY AUTOINCREMENT,
  sound_set TEXT NOT NULL,
  changed_by INTEGER NOT NULL,
  changed_at INTEGER NOT NULL
);
