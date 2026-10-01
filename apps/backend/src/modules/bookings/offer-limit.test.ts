import { MAX_ACTIVE_TRIPS } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { sendOffer } from './application/offers';
import { DRIVER, HOUR, NOW, setup } from './test-kit';

// An accepted offer becomes a trip of the driver: with no room for one more, the passenger got
// a puzzling "wrong status" (G27, docs/83 N09).
describe('a driver at the limit of live trips', () => {
  it('hears the limit before offering, not the passenger after accepting', async () => {
    const { deps, addTrip, addRequest, bonus } = setup();
    await bonus();
    for (let trip = 0; trip < MAX_ACTIVE_TRIPS; trip += 1) addTrip();
    const offer = { departAt: NOW + 26 * HOUR, price: 95_000 };
    expect(await sendOffer(deps, DRIVER, addRequest(), offer)).toEqual({
      ok: false,
      error: 'trips.too_many',
    });
  });
});
