-- G28: the time a booking was confirmed, so the booking shows its way: «Joy soʻraldi» →
-- «Joy tasdiqlandi» → «Mashinaga chiqdi» → «Yetib keldi» (docs/88 L6). Old bookings keep NULL:
-- their step shows without a time.
ALTER TABLE bookings ADD COLUMN confirmed_at INTEGER;
