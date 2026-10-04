// Test helper: people, the bot messages and the recommended price, without Telegram and other modules.
import type { Person } from '../users';
import { loadBrand } from '@platform/brands';
import { earliestDepart, NO_RATING, type BookingInput, type Trip } from '@platform/contracts';
import type { BookingsDeps, TripFacts } from './application/ports';
import { publicIdOf } from '../../test-people';

export const DRIVER = 1;
export const DILNOZA = 10;
export const ALI = 11;
export const OLIM = 12;

const person = (id: number, firstName: string, gender: Person['gender']): Person => ({
  id,
  publicId: publicIdOf(id),
  firstName,
  avatarKey: `avatars/${id}`,
  gender,
});

export const fakePeople = () =>
  new Map([
    [DRIVER, person(DRIVER, 'Jasur', 'male')],
    [DILNOZA, person(DILNOZA, 'Dilnoza', 'female')],
    [ALI, person(ALI, 'Ali', 'male')],
    [OLIM, person(OLIM, 'Olim', 'male')],
  ]);

export const fakeRecommend: BookingsDeps['recommend'] = async (from, to) => ({
  ok: true,
  value: {
    from,
    to,
    km: 300,
    price: 90_000,
    source: 'formula',
    minPrice: 30_000,
    maxPrice: 600_000,
    roundStep: 5000,
  },
});

export const fakeNotifier = (notes: string[]): BookingsDeps['notify'] => ({
  requested: async (booking) => void notes.push(`driver: request ${booking.passenger.firstName}`),
  confirmed: async (booking) => void notes.push(`passenger: confirmed ${booking.plate}`),
  declined: async () => void notes.push('passenger: declined'),
  expired: async () => void notes.push('passenger: expired'),
  cancelled: async (_booking, by) => void notes.push(`cancelled by ${by}`),
  offered: async (passengerId) => void notes.push(`offer to ${passengerId}`),
  progress: async (booking, step) => void notes.push(`close ones: ${booking.passenger.firstName} ${step}`),
  tripRetimed: async (booking) => void notes.push(`passenger: retimed ${booking.passenger.firstName}`),
  offerAnswered: async (_driverId, accepted) =>
    void notes.push(`offer ${accepted ? 'accepted' : 'declined'}`),
});

// The points of a booking: a home in Tashkent, a home in Samarkand; a point in Almaty is abroad.
export const HOME = { lat: 41.2856, lng: 69.2045 };
export const AWAY = { lat: 39.6547, lng: 66.9758 };
export const PITAK = {
  id: 'toshkent-avtovokzal',
  name: 'Toshkent avtovokzali',
  point: { lat: 41.2569, lng: 69.1925 },
};
// A booking from the door of HOME to AWAY: the way most tests take.
export const seats = (count: number, over: Partial<BookingInput> = {}): BookingInput => ({
  seats: count,
  mode: 'door',
  pickup: HOME,
  dropoff: AWAY,
  ...over,
});
const OUTSIDE = 45;
const NAMED = {
  district: '1726294',
  name: { step: 'mahalla', name: 'Qatortol' },
  area: { step: 'district', name: 'Chilonzor' },
} as const;
// 2026-10-01 06:00 in Tashkent.
export const NOW = Date.parse('2026-10-01T01:00:00Z');

// Every point fits the trip but a point far to the north: then it lies outside the district.
export const fakePlaces: BookingsDeps['places'] = {
  describe: async () => NAMED,
  fits: (point) => point.lat < OUTSIDE,
};

const CAR = { make: 'Chevrolet', model: 'Cobalt', color: 'white' } as const;

// A trip as the search shows it, with the seats taken by confirmed bookings.
export const fakeTripView = (facts: TripFacts, taken: number): Trip => {
  const { id: tripId, from, to, departAt, km, seats, price } = facts;
  const driver = {
    id: publicIdOf(facts.driverId),
    firstName: 'Jasur',
    hasAvatar: true,
    car: CAR,
    rating: NO_RATING,
  };
  const base = { id: tripId, from, to, departAt, km, seats, price, comment: '', woman: false };
  return {
    ...base,
    driver,
    seatsLeft: seats - taken,
    firstDepartAt: departAt,
    firstPrice: price,
    recommendedPrice: null,
    pickupMode: facts.pickupMode,
    pitak: facts.pickupMode === 'door' ? null : PITAK,
    status: 'active',
  };
};

export const SCHEDULE = loadBrand().schedule;
// The lead time and the limit of the brand; the road between trips is the trips module's (docs/103).
export function scheduleCheck(departAt: number, now: number, trips: Iterable<TripFacts>, driverId: number) {
  if (departAt < earliestDepart(now, SCHEDULE)) return 'trips.too_soon';
  const live = [...trips].filter((trip) => trip.driverId === driverId && trip.live).length;
  return live >= SCHEDULE.maxActiveTrips ? 'trips.too_many' : null;
}
