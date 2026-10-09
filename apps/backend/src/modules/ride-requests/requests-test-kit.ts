import type { Car } from '@platform/contracts';
import type { RequestsDeps } from './application/ports';
import { createMemoryRequests } from './infrastructure/memory-requests';
import { publicIdOf } from '../../test-people';

// The ride requests of the tests: a driver (id 9) with a car of 4 seats, two regions and a pitak.
// 2026-10-01 06:00 in Tashkent.
const NOW = Date.parse('2026-10-01T01:00:00Z');
const CAR: Car = { make: 'Chevrolet', model: 'Cobalt', color: 'white', plate: '01A123BC', seats: 4 };
export const HOME = { lat: 41.2856, lng: 69.2045 };
const AWAY = { lat: 39.6547, lng: 66.9758 };
// A man: «Men bilan ayol bor» is his to give (docs/06 rule 4); everyone else is a woman.
export const MAN = 5;
export const FAR_NORTH = { lat: 46, lng: 60 };
const PITAK = {
  id: 'toshkent-avtovokzal',
  name: 'Toshkent avtovokzali',
  point: { lat: 41.2569, lng: 69.1925 },
};
const PLACES = new Map(
  [
    { id: '1726', parentId: null, oneCity: true },
    { id: '1726273', parentId: '1726', oneCity: false },
    { id: '1718', parentId: null, oneCity: false },
    { id: '1718401', parentId: '1718', oneCity: false },
  ].map((place) => [place.id, place]),
);

type Board = RequestsDeps['board'];
type BoardTrip = Awaited<ReturnType<Board['trip']>>;

export function setup() {
  let now = NOW;
  let id = 0;
  let routes: Awaited<ReturnType<Board['directions']>> = [];
  let nearest: BoardTrip = null;
  const deps: RequestsDeps = {
    requests: createMemoryRequests(),
    people: {
      find: async (userId) => ({
        id: userId,
        publicId: publicIdOf(userId),
        firstName: `P${userId}`,
        avatarKey: null,
        avatarShown: false,
        gender: userId === MAN ? 'male' : 'female',
      }),
    },
    approvedCar: async (userId) => (userId === 9 ? CAR : null),
    recommend: async (from, to) =>
      from === to
        ? { ok: false, error: 'locations.same_place' }
        : {
            ok: true,
            value: {
              from,
              to,
              km: 300,
              price: 90000,
              source: 'formula',
              minPrice: 30000,
              maxPrice: 600000,
              roundStep: 5000,
            },
          },
    places: async () => PLACES,
    // Toshkent shahri → Samarqand viloyati has a pitak; a point far to the north is out of the route.
    pitakOf: async (from, to) => (from === '1726' && to === '1718' ? PITAK : null),
    fits: (point) => point.lat < 45,
    published: async () => undefined,
    hidden: async () => new Set(),
    board: { directions: async () => routes, trip: async () => nearest },
    ratings: async (ids) => new Map(ids.map((userId) => [userId, { average: 4.8, count: 12 }])),
    newId: () => `request-${(id += 1)}`,
    now: () => now,
  };
  const request = {
    from: '1726273',
    to: '1718401',
    date: '2026-10-01',
    seats: 1,
    price: 90000,
    pickupMode: 'door' as const,
    pickup: HOME,
    dropoff: AWAY,
    wholeCar: false,
    withWoman: false,
  };
  return {
    deps,
    request,
    setNow: (next: number) => void (now = next),
    directions: (next: typeof routes) => void (routes = next),
    boardTrip: (next: BoardTrip) => void (nearest = next),
  };
}
