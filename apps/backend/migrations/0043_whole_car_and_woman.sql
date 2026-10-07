-- G59: how a trip is booked (seats, seats or the whole car, only the whole car) and two marks of a
-- booking: the whole car, and «Men bilan ayol bor» (docs/06 rule 4, docs/09, docs/118).
ALTER TABLE trips ADD COLUMN booking_rule TEXT NOT NULL DEFAULT 'seats'
  CHECK (booking_rule IN ('seats', 'seats_or_car', 'car_only'));
ALTER TABLE bookings ADD COLUMN whole_car INTEGER NOT NULL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN with_woman INTEGER NOT NULL DEFAULT 0;
