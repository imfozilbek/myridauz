-- One complaint of an author about one ride (docs/17): the new complaint is written only when none of
-- the same author and booking is there, read through this index (G89, a double tap in one second).
CREATE INDEX complaints_author ON complaints (author_id, booking_id);
