import { describe, expect, it } from 'vitest';
import type { HistoryDeps } from './application/history';
import { standingOf } from './application/standing';

const ride = (bookingId: string, tripId: string) => ({
  bookingId,
  tripId,
  driverId: 1,
  passengerId: 2,
  seats: 1,
  price: 90_000,
  from: '1726273',
  to: '1718401',
  departAt: 0,
  km: 300,
});
const deps: HistoryDeps = {
  rides: async () => [ride('b1', 't1'), ride('b2', 't1'), ride('b3', 't2')],
  stars: async () => ({ given: new Map(), received: new Map() }),
  names: async () => new Map(),
  standing: async () => ({ rating: { average: 4.9, count: 23 }, onTime: 96 }),
};

describe('the three numbers on top of «Profil» (G65, mockup g65/3)', () => {
  it('a passenger counts the rides that are over; the rating and «vaqtida» come from the reviews', async () => {
    expect(await standingOf(deps, 2, 'passenger')).toEqual({
      rating: { average: 4.9, count: 23 },
      onTime: 96,
      trips: 3,
    });
  });

  it('a driver counts the trips that are over, not each passenger in them', async () => {
    expect((await standingOf(deps, 1, 'driver')).trips).toBe(2);
  });
});
