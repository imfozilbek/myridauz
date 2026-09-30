import { describe, expect, it } from 'vitest';
import { cancelEverything } from './application/cancel-all';
import { driverOffers, sendOffer } from './application/offers';
import { DILNOZA, DRIVER, HOUR, NOW, setup } from './test-kit';

describe('a blocked person leaves nothing open (docs/17, docs/65 A5)', () => {
  it('cancels the open requests of a passenger and the sent offers of a driver', async () => {
    const { deps, addRequest, bonus, requestOpen } = setup();
    await bonus();
    const own = addRequest({ passengerId: DRIVER });
    const other = addRequest({ passengerId: DILNOZA });
    await sendOffer(deps, DRIVER, other, { departAt: NOW + 26 * HOUR, price: 95_000 });
    await cancelEverything(deps, DRIVER);
    expect(requestOpen(own)).toBe(false);
    expect((await driverOffers(deps, DRIVER)).map((offer) => offer.status)).toEqual(['expired']);
  });
});
