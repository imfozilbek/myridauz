import { describe, expect, it } from 'vitest';
import { answer, confirm } from './application/answer';
import { sendOffer } from './application/offers';
import { requestBooking } from './application/request';
import { tellTripRetimed } from './application/trip-change';
import { ALI, DILNOZA, DRIVER, HOUR, NOW, OLIM, seats, setup } from './test-kit';

const value = <T>(result: { ok: true; value: T } | { ok: false; error: string }) => {
  if (!result.ok) throw new Error(result.error);
  return result.value;
};

describe('the driver moved the time (G39, docs/104, 8)', () => {
  it('tells the passengers with an open booking only, each once', async () => {
    const { deps, addTrip, bonus, notes } = setup();
    await bonus();
    const tripId = addTrip();
    const confirmed = value(await requestBooking(deps, DILNOZA, tripId, seats(1)));
    await confirm(deps, DRIVER, confirmed.id);
    await requestBooking(deps, OLIM, tripId, seats(1));
    const declined = value(await requestBooking(deps, ALI, tripId, seats(1)));
    await answer(deps, DRIVER, declined.id, 'decline');
    notes.length = 0;
    await tellTripRetimed(deps, tripId);
    expect(notes).toEqual(['passenger: retimed Dilnoza', 'passenger: retimed Olim']);
  });

  // G89 T13, B14: what waits for an answer moves with the trip.
  it('moves the deadline of a request cut by the old time', async () => {
    const { deps, addTrip, bonus, retime } = setup();
    await bonus();
    const departAt = NOW + 3 * HOUR;
    const tripId = addTrip({ departAt, endsAt: departAt + 7 * HOUR });
    const asked = value(await requestBooking(deps, DILNOZA, tripId, seats(1)));
    expect(asked.expiresAt).toBe(departAt);
    retime(tripId, departAt + HOUR);
    await tellTripRetimed(deps, tripId);
    expect((await deps.bookings.find(asked.id))?.expiresAt).toBeGreaterThan(departAt);
  });

  it('moves the time of an offer to the trip and shows it in the card of the request', async () => {
    const { deps, addTrip, addRequest, bonus, notes, retime } = setup();
    await bonus();
    const departAt = NOW + 26 * HOUR;
    const tripId = addTrip({ departAt, endsAt: departAt + 7 * HOUR });
    const requestId = addRequest();
    const offer = value(await sendOffer(deps, DRIVER, requestId, { departAt: 0, price: 1, tripId }));
    retime(tripId, departAt + HOUR);
    notes.length = 0;
    await tellTripRetimed(deps, tripId);
    expect((await deps.offers.find(offer.id))?.departAt).toBe(departAt + HOUR);
    expect(notes).toContain(`request card: ${requestId}`);
  });
});
