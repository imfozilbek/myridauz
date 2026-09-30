-- G20 (docs/65 A1): a trip and an offer keep the car the team approved when they were made.
-- A new face or car photo sends the driver to a check again, but his trips, bookings, posts and offers stay.
ALTER TABLE trips ADD COLUMN car_make TEXT;
ALTER TABLE trips ADD COLUMN car_model TEXT;
ALTER TABLE trips ADD COLUMN car_color TEXT;
ALTER TABLE trips ADD COLUMN car_plate TEXT;
ALTER TABLE offers ADD COLUMN car_make TEXT;
ALTER TABLE offers ADD COLUMN car_model TEXT;
ALTER TABLE offers ADD COLUMN car_color TEXT;

-- Trips and offers made before: the car of the driver's application now.
UPDATE trips SET
  car_make = (SELECT car_make FROM driver_applications WHERE user_id = trips.driver_id),
  car_model = (SELECT car_model FROM driver_applications WHERE user_id = trips.driver_id),
  car_color = (SELECT car_color FROM driver_applications WHERE user_id = trips.driver_id),
  car_plate = (SELECT car_plate FROM driver_applications WHERE user_id = trips.driver_id);
UPDATE offers SET
  car_make = (SELECT car_make FROM driver_applications WHERE user_id = offers.driver_id),
  car_model = (SELECT car_model FROM driver_applications WHERE user_id = offers.driver_id),
  car_color = (SELECT car_color FROM driver_applications WHERE user_id = offers.driver_id);
