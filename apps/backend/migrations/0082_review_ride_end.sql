-- G89 A10: the blind days of a review count from the end of its ride (docs/129), not from the review.
-- Empty for the reviews written before: they keep the old rule, from the review.
ALTER TABLE reviews ADD COLUMN ride_ends_at INTEGER;
