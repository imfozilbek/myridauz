import type { SubscriptionInput } from '@platform/contracts';
import { placeMatches } from '../../shared/places/place-match';
import type { SubscriptionsDeps } from './application/ports';
import type { Match } from './domain/subscription';
import { createMemorySubscriptions } from './infrastructure/subscription-store';

// Test helper of the route subscriptions: places, a route, a trip and deps that write what they tell.
export const MINUTE = 60 * 1000;
// 2026-10-01 06:00 in Tashkent.
const NOW = Date.parse('2026-10-01T01:00:00Z');
const PLACES = new Map(
  [
    { id: '1726', parentId: null, oneCity: true },
    { id: '1726269', parentId: '1726', oneCity: false },
    { id: '1726294', parentId: '1726', oneCity: false },
    { id: '1718', parentId: null, oneCity: false },
    { id: '1718401', parentId: '1718', oneCity: false },
    { id: '1718233', parentId: '1718', oneCity: false },
  ].map((place) => [place.id, place]),
);
export const ROUTE: SubscriptionInput = { from: '1726269', to: '1718', date: '2026-10-02', woman: false };
export const TRIP: Match = {
  id: 't1',
  ownerId: 9,
  from: '1726294',
  to: '1718401',
  date: '2026-10-02',
  woman: false,
  time: '08:30',
  seats: 3,
  price: 85000,
};

export function setup() {
  let now = NOW;
  let id = 0;
  const told: string[] = [];
  const deps: SubscriptionsDeps = {
    subscriptions: createMemorySubscriptions(),
    placeMatches: async () => (placeId, searchId) => placeMatches(placeId, searchId, PLACES),
    tell: {
      one: async (s, match) => void told.push(`one ${s.userId} ${match.id}`),
      many: async (s, count) => void told.push(`many ${s.userId} ${count}`),
      renew: async (s) => void told.push(`renew ${s.userId}`),
      cheaper: async (s, match) => void told.push(`cheaper ${s.userId} ${match.id}`),
    },
    newId: () => `s${(id += 1)}`,
    now: () => now,
  };
  return { deps, told, pass: (ms: number) => void (now += ms) };
}
