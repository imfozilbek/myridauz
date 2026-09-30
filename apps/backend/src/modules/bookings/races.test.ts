import { describe, expect, it } from 'vitest';
import { balanceOf } from '../wallet/domain/ledger';
import { acceptOffer } from './application/accept';
import { answer, confirm } from './application/answer';
import { sendOffer } from './application/offers';
import { cancelByPassenger, passengerBookings, requestBooking } from './application/request';
import { ALI, DILNOZA, DRIVER, HOUR, NOW, OLIM, setup } from './test-kit';

const idOf = (result: { ok: boolean; value?: { id: string } }) =>
  result.ok && result.value ? result.value.id : '';

describe('two taps at the same moment (docs/65 A4)', () => {
  it('confirms only as many seats as the trip has, and charges only what the wallet holds', async () => {
    const { deps, addTrip, bonus, wallet } = setup();
    await bonus();
    const tripId = addTrip({ seats: 2 });
    const first = idOf(await requestBooking(deps, DILNOZA, tripId, 2));
    const second = idOf(await requestBooking(deps, ALI, tripId, 2));
    const results = await Promise.all([confirm(deps, DRIVER, first), confirm(deps, DRIVER, second)]);
    expect(results.map((result) => result.ok).sort()).toEqual([false, true]);
    // One booking of 2 seats at 90 000: 18 000 from the bonus, never twice.
    expect(balanceOf(await wallet(), 'bonus')).toBe(482_000);
  });

  it('never takes more than the wallet holds when two trips are confirmed at once', async () => {
    const { deps, addTrip, bonus, wallet, spend } = setup();
    await bonus();
    await spend(500_000 - 18_000);
    const first = idOf(await requestBooking(deps, DILNOZA, addTrip(), 2));
    const second = idOf(await requestBooking(deps, OLIM, addTrip(), 2));
    const results = await Promise.all([confirm(deps, DRIVER, first), confirm(deps, DRIVER, second)]);
    expect(results.filter((result) => result.ok)).toHaveLength(1);
    // One commission of 18 000; the empty bonus then brings the next grant of the promo (docs/12).
    const commissions = (await wallet()).filter((op) => op.kind === 'commission' && op.bookingId !== null);
    expect(commissions.map((op) => op.amount)).toEqual([-482_000, -18_000]);
  });

  it('accepts an offer only once: one trip, one booking, one commission', async () => {
    const { deps, addRequest, bonus, wallet } = setup();
    await bonus();
    const requestId = addRequest();
    const sent = idOf(await sendOffer(deps, DRIVER, requestId, { departAt: NOW + 26 * HOUR, price: 95_000 }));
    const results = await Promise.all([acceptOffer(deps, DILNOZA, sent), acceptOffer(deps, DILNOZA, sent)]);
    expect(results.map((result) => result.ok).sort()).toEqual([false, true]);
    expect(await passengerBookings(deps, DILNOZA)).toHaveLength(1);
    expect(balanceOf(await wallet(), 'bonus')).toBe(481_000);
  });

  it('does not cancel a confirmed booking after the departure: no refund of a ride that happened', async () => {
    const { deps, addTrip, bonus, setNow } = setup();
    await bonus();
    const tripId = addTrip({ departAt: NOW + 2 * HOUR, endsAt: NOW + 9 * HOUR });
    const booked = idOf(await requestBooking(deps, DILNOZA, tripId, 1));
    await confirm(deps, DRIVER, booked);
    setNow(NOW + 3 * HOUR);
    expect(await cancelByPassenger(deps, DILNOZA, booked)).toEqual({
      ok: false,
      error: 'bookings.wrong_status',
    });
    expect(await answer(deps, DRIVER, booked, 'driver_cancel')).toEqual({
      ok: false,
      error: 'bookings.wrong_status',
    });
  });
});
