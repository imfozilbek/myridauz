import { BOOKING_NOTE_MAX, bookingInputSchema } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { cancelByPassenger, requestBooking } from './application/request';
import { confirm, driverBookings } from './application/answer';
import { DILNOZA, DRIVER, seats, setup } from './test-kit';

// The note of the passenger (owner decision 08.10.2026, mockup g63/4 screen 13): how the driver
// knows the passenger at the point. No contacts in it (docs/07); it goes with the points (docs/69).
describe('the note of a booking', () => {
  it('reaches the driver without a phone or a username in it', async () => {
    const { deps, addTrip, bonus } = setup();
    await bonus();
    const tripId = addTrip();
    const note = 'Qizil kurtka, +998 90 123 45 67 @dilnoza';
    const booked = await requestBooking(deps, DILNOZA, tripId, seats(1, { note }));
    expect(booked.ok && booked.value.note).toMatch(/^Qizil kurtka, /u);
    await confirm(deps, DRIVER, booked.ok ? booked.value.id : '');
    const [seen] = await driverBookings(deps, DRIVER);
    expect(seen?.note).toMatch(/^Qizil kurtka, /u);
    expect(seen?.note).not.toMatch(/123|dilnoza/u);
  });

  it('is gone with the points when the ride will not happen', async () => {
    const { deps, addTrip } = setup();
    const booked = await requestBooking(deps, DILNOZA, addTrip(), seats(1, { note: 'Sumka bilan' }));
    const id = booked.ok ? booked.value.id : '';
    await cancelByPassenger(deps, DILNOZA, id);
    expect((await deps.bookings.find(id))?.note).toBeNull();
  });

  it('is empty without a note and short by the contract', async () => {
    const { deps, addTrip } = setup();
    const booked = await requestBooking(deps, DILNOZA, addTrip(), seats(1));
    expect(booked.ok && booked.value.note).toBeNull();
    const long = { ...seats(1), note: 'a'.repeat(BOOKING_NOTE_MAX + 1) };
    expect(bookingInputSchema.safeParse(long).success).toBe(false);
  });
});
