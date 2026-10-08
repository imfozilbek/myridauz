import { describe, expect, it } from 'vitest';
import { answer, confirm } from './application/answer';
import { expireTripRequests } from './application/expire';
import { cancelByPassenger, requestBooking } from './application/request';
import { DILNOZA, DRIVER, HOUR, NOW, OLIM, setup, seats } from './test-kit';

describe('a trip that already left (docs/65 B8)', () => {
  it('takes no booking from an old link: the trip is on the road', async () => {
    const { deps, addTrip, setNow } = setup();
    const tripId = addTrip({ departAt: NOW + 2 * HOUR, endsAt: NOW + 9 * HOUR });
    setNow(NOW + 3 * HOUR);
    expect(await requestBooking(deps, DILNOZA, tripId, seats(1))).toEqual({
      ok: false,
      error: 'bookings.departed',
    });
  });

  it('counts an early «Yoʻlga chiqdim» as the departure: no booking, no cancel of a seat (G63)', async () => {
    const { deps, addTrip, bonus, departEarly } = setup();
    await bonus();
    const tripId = addTrip({ departAt: NOW + 2 * HOUR, endsAt: NOW + 9 * HOUR });
    const booked = await requestBooking(deps, DILNOZA, tripId, seats(1));
    const id = booked.ok ? booked.value.id : '';
    expect((await confirm(deps, DRIVER, id)).ok).toBe(true);
    departEarly(tripId);
    const refused = { ok: false, error: 'bookings.departed' };
    expect(await requestBooking(deps, OLIM, tripId, seats(1))).toEqual(refused);
    const kept = { ok: false, error: 'bookings.wrong_status' };
    expect(await cancelByPassenger(deps, DILNOZA, id)).toEqual(kept);
    expect(await answer(deps, DRIVER, id, 'driver_cancel')).toEqual(kept);
  });

  it('ends the waiting requests at an early «Yoʻlga chiqdim»: no seat, no commission (G63)', async () => {
    const { deps, addTrip, bonus, departEarly, wallet, notes } = setup();
    await bonus();
    const tripId = addTrip({ departAt: NOW + 2 * HOUR, endsAt: NOW + 9 * HOUR });
    const asked = await requestBooking(deps, DILNOZA, tripId, seats(1));
    const id = asked.ok ? asked.value.id : '';
    departEarly(tripId);
    const before = await wallet();
    expect(await confirm(deps, DRIVER, id)).toEqual({ ok: false, error: 'bookings.wrong_status' });
    expect(await wallet()).toEqual(before);
    await expireTripRequests(deps, tripId);
    expect(await deps.bookings.find(id)).toMatchObject({ status: 'expired', pickup: null });
    expect(notes.filter((note) => note === 'passenger: expired')).toHaveLength(1);
    await expireTripRequests(deps, tripId);
    expect(notes.filter((note) => note === 'passenger: expired')).toHaveLength(1);
  });
});
