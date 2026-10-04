-- G39: a driver moves the time up to +1 hour from the first time and only lowers the price
-- (docs/104). The first time and price stay; the last price notice keeps it to one a day.
ALTER TABLE trips ADD COLUMN first_depart_at INTEGER;
ALTER TABLE trips ADD COLUMN first_price INTEGER;
ALTER TABLE trips ADD COLUMN price_told_at INTEGER;
UPDATE trips SET first_depart_at = depart_at, first_price = price WHERE first_depart_at IS NULL;
