-- G64 (docs/118 path 7): a driver and a passenger talk about a request before a booking. One talk per
-- request and driver: its chat «t<id>» holds the messages, the calls and every offer of this driver
-- on this request, and the booking the offer became.
CREATE TABLE request_talks (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  driver_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX request_talks_pair ON request_talks (request_id, driver_id);
-- A deleted account takes the talks of its driver with it (docs/30).
CREATE INDEX request_talks_driver ON request_talks (driver_id);
-- The talk of an offer and of the booking made of it; NULL before G64 (their chat stays «o<offer>»).
ALTER TABLE offers ADD COLUMN talk_id TEXT;
ALTER TABLE bookings ADD COLUMN talk_id TEXT;
-- «Safarimga taklif qilish» and «Safar ochib taklif qilish»: the trip the offer goes on; NULL: a trip
-- is made when the passenger accepts (G08 way).
ALTER TABLE offers ADD COLUMN trip_id TEXT;
-- The passenger turned the calls of drivers about the request off (docs/127).
ALTER TABLE ride_requests ADD COLUMN calls_off INTEGER NOT NULL DEFAULT 0;
-- A trip opened from a «Boʻsh salon kerak» request: only that passenger sees it until the answer;
-- NULL: everybody sees it.
ALTER TABLE trips ADD COLUMN for_request TEXT;
