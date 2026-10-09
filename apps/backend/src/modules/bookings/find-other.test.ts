import { loadBrand } from '@platform/brands';
import { tashkentDate } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import type { Card, Ring } from '../notifications';
import { requestBooking } from './application/request';
import { passengerNews } from './infrastructure/passenger-news';
import { DILNOZA, seats, setup } from './test-kit';

// A refused, burned or cancelled seat leads to the trips of the same route and day (docs/89 S10).
describe('«Boshqa safar topish» under a booking that ended', () => {
  it('opens the search of the route and the day, not the dead booking', async () => {
    const { deps, addTrip } = setup();
    const asked = await requestBooking(deps, DILNOZA, addTrip(), seats(1));
    if (!asked.ok) throw new Error(asked.error);
    const shown: { cards: readonly Card[]; rings: readonly Ring[] }[] = [];
    const tell = passengerNews({
      brand: loadBrand(),
      places: async () => new Map(),
      show: async (cards, rings) => void shown.push({ cards, rings }),
      telegramId: async () => 42,
      now: Date.now,
    });
    const { trip } = asked.value;
    const find = `?find=${trip.from}_${trip.to}_${tashkentDate(trip.departAt)}`;
    for (const status of ['declined', 'expired', 'cancelled_by_driver'] as const)
      await tell({ ...asked.value, status }, status === 'cancelled_by_driver' ? 'cancelledByDriver' : status);
    const urls = shown.map(({ cards }) => JSON.stringify(cards[0]?.markup));
    expect(urls).toHaveLength(3);
    expect(urls.every((url) => url.includes(find) && url.includes('Boshqa safar topish'))).toBe(true);
    // The seat is over: the card leaves the top of the chat (docs/122 rule 6).
    expect(shown.every(({ cards }) => cards[0]?.pin === false)).toBe(true);
  });
});
