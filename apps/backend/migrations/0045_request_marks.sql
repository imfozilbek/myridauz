-- G61: the marks of a passenger's request (docs/06 rule 4, docs/118 path 4): «Boʻsh salon kerak»
-- and «Men bilan ayol bor»; the seats of an offer, all the car's seats when the whole car is asked.
ALTER TABLE ride_requests ADD COLUMN whole_car INTEGER NOT NULL DEFAULT 0;
ALTER TABLE ride_requests ADD COLUMN with_woman INTEGER NOT NULL DEFAULT 0;
ALTER TABLE offers ADD COLUMN seats INTEGER;
-- The plate of the car of an offer, on the offer card before the answer (owner decision 07.10.2026).
ALTER TABLE offers ADD COLUMN car_plate TEXT;
