-- G90 (owner decision 20.10.2026, docs/216): a driver may leave within a range of whole hours,
-- «08:00 dan 10:00 gacha». The end of the range; NULL: one exact time, as every older trip.
ALTER TABLE trips ADD COLUMN depart_until INTEGER;
