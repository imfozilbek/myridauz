-- The pitak of a «Pitakdan» trip is taken at the publishing, like the car (G89 T8, docs/70): the team
-- may close or change the pitak of the direction later, the trip keeps the place the driver chose.
ALTER TABLE trips ADD COLUMN pitak_id TEXT;
