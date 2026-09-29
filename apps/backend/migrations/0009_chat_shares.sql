-- G09: the chat key of a booking made from an offer, the passenger's "Mashinaga chiqdim" and
-- "Yetib keldim", and "Yaqinlarimga yuborish" (docs/07, docs/43). Chat messages live in the
-- chat's own Durable Object, not here.
ALTER TABLE bookings ADD COLUMN offer_id TEXT;
ALTER TABLE bookings ADD COLUMN boarded_at INTEGER;
ALTER TABLE bookings ADD COLUMN arrived_at INTEGER;
UPDATE bookings SET offer_id = (SELECT id FROM offers WHERE offers.booking_id = bookings.id);

-- Only a hash of the link token is kept: a copy of the database opens no trip.
CREATE TABLE trip_shares (
  token_hash TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES bookings (id),
  created_at INTEGER NOT NULL,
  revoked_at INTEGER
);
CREATE INDEX trip_shares_booking ON trip_shares (booking_id);

-- The close people who asked for bot messages about the trip: at most 5 per booking.
CREATE TABLE share_followers (
  booking_id TEXT NOT NULL REFERENCES bookings (id),
  telegram_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (booking_id, telegram_id)
);
