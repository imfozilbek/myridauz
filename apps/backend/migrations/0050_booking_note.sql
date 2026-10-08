-- G63: the note of the passenger for the driver at the meeting («Qizil kurtka, sumka bilan», mockup
-- g63/4 screen 13, owner decision 08.10.2026). Contacts masked before the write (docs/07); erased with
-- the points (docs/69). NULL: no note or erased.
ALTER TABLE bookings ADD COLUMN note TEXT;
