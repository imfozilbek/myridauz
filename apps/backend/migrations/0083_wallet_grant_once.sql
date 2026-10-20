-- G89: each grant of the promo (bonus 1, 2, 3) comes once per driver: the approval and the hourly job
-- for a missed bonus, or two charges at once, never give the same bonus twice. Grants of before keep
-- no number.
ALTER TABLE wallet_operations ADD COLUMN grant_no INTEGER;
CREATE UNIQUE INDEX wallet_grant_once ON wallet_operations (driver_id, grant_no) WHERE grant_no IS NOT NULL;
