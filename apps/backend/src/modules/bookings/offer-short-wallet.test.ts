import { describe, expect, it } from 'vitest';
import { acceptOffer } from './application/accept';
import { passengerOffers, sendOffer } from './application/offers';
import { DILNOZA, DRIVER, HOUR, NOW, setup } from './test-kit';

// 2026-10-02 08:00 in Tashkent: the day of the request.
const ON_THE_DAY = NOW + 26 * HOUR;
const BONUS = 500_000;
const GRANTS = 3;
// All three bonuses of the promo are spent: the next one does not come (G89 M1).
const spendAll = async (spend: (amount: number) => Promise<unknown>) => {
  for (let grant = 0; grant < GRANTS; grant += 1) await spend(BONUS);
};
// 10% of 95 000 for the 2 seats of the request.
const COMMISSION = 19_000;

// G89 B5, U8 (owner text 20.10.2026): the commission is the driver's business (docs/12). A passenger
// who accepts an offer of a driver short of money reads that the offer does not work now, never the
// wallet text; the driver hears what is missing and the offer waits for the top up.
describe('an offer accepted while the driver is short of money', () => {
  it('on a new trip: the passenger reads her text, the driver is told, the offer stays', async () => {
    const { deps, addRequest, bonus, spend, notes } = setup();
    await bonus();
    const sent = await sendOffer(deps, DRIVER, addRequest(), { departAt: ON_THE_DAY, price: 95_000 });
    if (!sent.ok) throw new Error(sent.error);
    await spendAll(spend);
    expect(await acceptOffer(deps, DILNOZA, sent.value.id)).toEqual({
      ok: false,
      error: 'bookings.offer_unavailable',
    });
    expect(notes).toContain(`driver ${DRIVER}: wallet short ${COMMISSION}`);
    expect((await passengerOffers(deps, DILNOZA))[0]?.status).toBe('sent');
  });

  it('on a trip of the driver: the same', async () => {
    const { deps, addTrip, addRequest, bonus, spend, notes } = setup();
    await bonus();
    const tripId = addTrip({ departAt: ON_THE_DAY, price: 95_000 });
    const sent = await sendOffer(deps, DRIVER, addRequest(), { departAt: 0, price: 1, tripId });
    if (!sent.ok) throw new Error(sent.error);
    await spendAll(spend);
    expect(await acceptOffer(deps, DILNOZA, sent.value.id)).toEqual({
      ok: false,
      error: 'bookings.offer_unavailable',
    });
    expect(notes).toContain(`driver ${DRIVER}: wallet short ${COMMISSION}`);
  });

  // A car on a new check never takes the seat: the offer ends, not «no money» again and again.
  it('ends the offer of a car on a new check', async () => {
    const { deps, addRequest, bonus, recheck } = setup();
    await bonus();
    const sent = await sendOffer(deps, DRIVER, addRequest(), { departAt: ON_THE_DAY, price: 95_000 });
    if (!sent.ok) throw new Error(sent.error);
    recheck();
    expect(await acceptOffer(deps, DILNOZA, sent.value.id)).toEqual({
      ok: false,
      error: 'bookings.wrong_status',
    });
    expect((await deps.offers.find(sent.value.id))?.status).toBe('expired');
  });
});
