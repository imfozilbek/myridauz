import { describe, expect, it } from 'vitest';
import { cancelByPassenger, requestBooking } from './application/request';
import { AWAY, DILNOZA, PITAK, seats, setup } from './test-kit';

const ABROAD = { lat: 43.2389, lng: 76.8897 };
// Inside Uzbekistan, but far from the districts of the route (the fake says: north of 45).
const FAR_NORTH = { lat: 45.2, lng: 58.8 };

describe('the way and the points of a booking (G24, docs/70)', () => {
  it('books from the pitak of the direction without a point at the door', async () => {
    const { deps, addTrip } = setup();
    const booked = await requestBooking(deps, DILNOZA, addTrip(), seats(1, { mode: 'pitak', pickup: null }));
    expect(booked.ok && booked.value).toMatchObject({ mode: 'pitak', pitak: PITAK, pickup: null });
  });

  it('takes only a way the trip offers, and «Pitakdan» only where the direction has a pitak', async () => {
    const { deps, addTrip } = setup();
    const wrong = { ok: false, error: 'bookings.wrong_mode' };
    const byPitak = seats(1, { mode: 'pitak', pickup: null });
    expect(await requestBooking(deps, DILNOZA, addTrip({ pickupMode: 'door' }), byPitak)).toEqual(wrong);
    expect(await requestBooking(deps, DILNOZA, addTrip({ pickupMode: 'pitak' }), seats(1))).toEqual(wrong);
    expect(await requestBooking(deps, DILNOZA, addTrip(), seats(1, { pickup: null }))).toEqual(wrong);
  });

  it('keeps the points inside Uzbekistan and inside the districts of the route', async () => {
    const { deps, addTrip } = setup();
    const tripId = addTrip();
    expect(await requestBooking(deps, DILNOZA, tripId, seats(1, { dropoff: ABROAD }))).toEqual({
      ok: false,
      error: 'bookings.outside_country',
    });
    expect(await requestBooking(deps, DILNOZA, tripId, seats(1, { pickup: FAR_NORTH }))).toEqual({
      ok: false,
      error: 'bookings.outside_area',
    });
  });

  it('never changes the way after the booking: only a cancel and a new booking (docs/70)', async () => {
    const { deps, addTrip } = setup();
    const tripId = addTrip();
    const first = await requestBooking(deps, DILNOZA, tripId, seats(1));
    expect(first.ok && first.value.dropoff?.point).toEqual(AWAY);
    const again = await requestBooking(deps, DILNOZA, tripId, seats(1, { mode: 'pitak', pickup: null }));
    expect(again).toEqual({ ok: false, error: 'bookings.wrong_status' });
    await cancelByPassenger(deps, DILNOZA, first.ok ? first.value.id : '');
    const second = await requestBooking(deps, DILNOZA, tripId, seats(1, { mode: 'pitak', pickup: null }));
    expect(second.ok && second.value.mode).toBe('pitak');
  });
});
