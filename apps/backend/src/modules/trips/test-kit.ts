// Test helper: trips with two approved drivers (a man and a woman) and a fake price engine.
import type { Car, Recommendation } from '@platform/contracts';
import { maskContacts } from '../chat/domain/mask';
import type { Person } from '../users';
import type { Rider, TripsDeps } from './application/ports';
import { createMemoryTrips } from './infrastructure/memory-trips';
import { publicIdOf } from '../../test-people';

export const HOUR = 60 * 60 * 1000;
// 2026-10-01 06:00 in Tashkent.
export const NOW = Date.parse('2026-10-01T01:00:00Z');
const CAR: Car = { make: 'Chevrolet', model: 'Cobalt', color: 'white', plate: '01A123BC', seats: 4 };
const person = (id: number, gender: Person['gender']): Person => ({
  id,
  publicId: publicIdOf(id),
  firstName: `P${id}`,
  avatarKey: null,
  gender,
});
const PLACES = new Map(
  [
    { id: '1726', parentId: null, oneCity: true },
    { id: '1726273', parentId: '1726', oneCity: false },
    { id: '1726294', parentId: '1726', oneCity: false },
    { id: '1718', parentId: null, oneCity: false },
    { id: '1718401', parentId: '1718', oneCity: false },
    { id: '1718233', parentId: '1718', oneCity: false },
  ].map((place) => [place.id, place]),
);

export function setup() {
  let now = NOW;
  let price = 90000;
  let id = 0;
  const riders: Rider[] = [];
  const events: string[] = [];
  const cars = new Map<number, Car>([
    [1, CAR],
    [2, CAR],
  ]);
  const people = new Map([
    [1, person(1, 'male')],
    [2, person(2, 'female')],
    [3, person(3, 'male')],
  ]);
  const deps: TripsDeps = {
    trips: createMemoryTrips(),
    riders: async (tripIds) => riders.filter((rider) => tripIds.includes(rider.tripId)),
    people: { find: async (userId) => people.get(userId) },
    approvedCar: async (userId) => cars.get(userId) ?? null,
    ratings: async () => new Map(),
    hidden: async () => new Set(),
    recommend: async (from, to) => {
      if (from.startsWith('1726') && to.startsWith('1726'))
        return { ok: false, error: 'locations.inside_city' };
      const value: Recommendation = {
        from,
        to,
        km: 300,
        price,
        source: 'formula',
        minPrice: 30000,
        maxPrice: 600000,
        roundStep: 5000,
      };
      return { ok: true, value };
    },
    places: async () => PLACES,
    // The driver bot message about a trip: the driver answers it with the meeting point.
    announce: async () => 77,
    changed: async (tripId, event) => void events.push(`${event} ${tripId}`),
    mask: (text) => maskContacts(text).text,
    newId: () => `trip-${(id += 1)}`,
    now: () => now,
  };
  const trip = { from: '1726273', to: '1718401', seats: 3, price: 90000, womanOnBoard: false, comment: '' };
  return {
    deps,
    trip: { ...trip, departAt: NOW + 3 * HOUR },
    setNow: (next: number) => void (now = next),
    setFormula: (next: number) => void (price = next),
    // A new face or car photo: the driver goes to the team's check again (docs/05).
    recheck: (userId: number) => void cars.delete(userId),
    ride: (rider: Rider) => void riders.push(rider),
    events,
  };
}
