import { loadBrand } from '@platform/brands';
import type { Ask, RatingsDeps, RatingStore, Ride } from './application/ports';
import { createMemoryRatings } from './infrastructure/memory-ratings';
import { idOfPublic, publicIdOf } from '../../test-people';

// Test helper: the ratings over memory, a clock that moves and the rides of one driver (docs/24).
const NOW = Date.parse('2026-10-05T12:00:00Z');
export const HOUR = 3_600_000;
export const RULES = loadBrand().ratings;
export const DRIVER = 1;
export const ride = (n: number, over = true): Ride => ({
  bookingId: `b${n}`,
  tripId: `t${n}`,
  driverId: DRIVER,
  passengerId: 100 + n,
  endsAt: NOW - HOUR,
  over,
});

// The store is memory, or D1 where a test reads the SQL too.
export function setup(rides: Ride[] = [ride(1)], store: RatingStore = createMemoryRatings()) {
  let clock = NOW;
  const asked: { ask: Ask; name: string; rater: string; reminder: boolean }[] = [];
  const alerts: { name: string; publicId: string }[] = [];
  const told: (readonly [number, string])[] = [];
  const deps: RatingsDeps = {
    store,
    rides: {
      ended: async (from, to) => rides.filter((known) => known.endsAt >= from && known.endsAt < to),
      find: async (id) => rides.find((known) => known.bookingId === id),
    },
    names: async (ids) => new Map(ids.map((id) => [id, id === DRIVER ? 'Jasur' : `P${id}`])),
    people: { publicId: async (id) => publicIdOf(id), idOf: idOfPublic },
    ask: async (ask, name, { rater }, reminder) => void asked.push({ ask, name, rater, reminder }),
    alertTeam: async (person) => void alerts.push(person),
    tellLow: async (userId, role) => void told.push([userId, role]),
    mask: (text) => text.replace(/\+?\d{9,}/gu, '***'),
    limits: RULES,
    now: () => clock,
    newId: () => `r${Math.random()}`,
  };
  return { deps, asked, alerts, told, later: (ms: number) => void (clock += ms) };
}
export const review = (bookingId: string, stars: number, text = '') => ({ bookingId, stars, tags: [], text });
