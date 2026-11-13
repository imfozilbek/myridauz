-- G99 T7 (docs/234, docs/117): the paths of «Statistika» read the confirmed and the boarded seats of a
-- period through these, never all the bookings.
CREATE INDEX bookings_confirmed ON bookings (confirmed_at);
CREATE INDEX bookings_boarded ON bookings (boarded_at);
