-- The corrections of a distance by the owner (G45, docs/48): who, when, the km before and after.
-- km_before is NULL for a pair that had no distance.
CREATE TABLE location_distance_changes (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  km_before INTEGER,
  km_after INTEGER NOT NULL CHECK (km_after > 0),
  changed_by INTEGER NOT NULL,
  changed_at INTEGER NOT NULL,
  CHECK (from_id < to_id)
);
CREATE INDEX location_distance_changes_pair ON location_distance_changes (from_id, to_id, changed_at);
