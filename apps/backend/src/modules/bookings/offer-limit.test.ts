import { describe, expect, it } from 'vitest';
import { sendOffer } from './application/offers';
import { DRIVER, HOUR, NOW, SCHEDULE, setup } from './test-kit';

// An accepted offer becomes a trip of the driver: with no room for one more, the passenger got
// a puzzling "wrong status" (G27, docs/83 N09).
describe('a driver at the limit of live trips', () => {
  it('hears the limit before offering, not the passenger after accepting', async () => {
    const { deps, addTrip, addRequest, bonus } = setup();
    await bonus();
    for (let trip = 0; trip < SCHEDULE.maxActiveTrips; trip += 1) addTrip();
    const offer = { departAt: NOW + 26 * HOUR, price: 95_000 };
    expect(await sendOffer(deps, DRIVER, addRequest(), offer)).toEqual({
      ok: false,
      error: 'trips.too_many',
    });
  });

  // G38 (docs/103): an offer leaves an hour after it is made at the earliest, like a trip.
  it('cannot offer a time sooner than the lead time', async () => {
    const { deps, addRequest, bonus } = setup();
    await bonus();
    const offer = { departAt: NOW + HOUR / 2, price: 95_000 };
    const today = addRequest({ date: '2026-10-01' });
    const result = await sendOffer(deps, DRIVER, today, offer);
    expect(result).toEqual({ ok: false, error: 'trips.too_soon' });
  });
});
