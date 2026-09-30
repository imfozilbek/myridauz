// Test helper: bookings over fake trips and requests, with the real wallet in memory (docs/12).
import { NO_RATING, type Car, type Trip } from '@platform/contracts';
import type { Person } from '../users';
import { commissionFor } from '@platform/brands';
import { canAfford, charge, grantWelcome, refund } from '../wallet/application/wallet';
import type { WalletDeps } from '../wallet/application/ports';
import { createMemoryWallet } from '../wallet/infrastructure/memory-wallet';
import type { BookingsDeps, RequestFacts, TripFacts } from './application/ports';
import { createMemoryBookings, createMemoryOffers } from './infrastructure/memory-bookings';
import { fakeNotifier, fakeRecommend } from './test-fakes';

export const HOUR = 60 * 60 * 1000;
// 2026-10-01 06:00 in Tashkent.
export const NOW = Date.parse('2026-10-01T01:00:00Z');
const CAR: Car = { make: 'Chevrolet', model: 'Cobalt', color: 'white', plate: '01A123BC', seats: 4 };
const person = (id: number, firstName: string, gender: Person['gender']): Person => ({
  id,
  firstName,
  avatarKey: `avatars/${id}`,
  gender,
});
export const DRIVER = 1;
export const DILNOZA = 10;
export const ALI = 11;
export const OLIM = 12;

export function setup() {
  let now = NOW;
  let approved = true;
  let id = 0;
  const newId = () => `00000000-0000-0000-0000-${String((id += 1)).padStart(12, '0')}`;
  const people = new Map([
    [DRIVER, person(DRIVER, 'Jasur', 'male')],
    [DILNOZA, person(DILNOZA, 'Dilnoza', 'female')],
    [ALI, person(ALI, 'Ali', 'male')],
    [OLIM, person(OLIM, 'Olim', 'male')],
  ]);
  const trips = new Map<string, TripFacts>();
  const requests = new Map<string, RequestFacts>();
  const notes: string[] = [];
  const walletDeps: WalletDeps = {
    wallet: createMemoryWallet(),
    promo: { amount: 500_000, grants: 3, days: 30, windowDays: 90 },
    people: { find: async (userId) => people.get(userId) },
    now: () => now,
    newId,
  };
  const bookings = createMemoryBookings();
  const view = async (facts: TripFacts): Promise<Trip> => {
    const taken = (await bookings.byTrips([facts.id]))
      .filter((booking) => booking.status === 'confirmed')
      .reduce((sum, booking) => sum + booking.seats, 0);
    const { id: tripId, from, to, departAt, km, seats, price } = facts;
    const driver = { id: facts.driverId, firstName: 'Jasur', hasAvatar: true, car: CAR, rating: NO_RATING };
    const base = { id: tripId, from, to, departAt, km, seats, price, comment: '', woman: false };
    return {
      ...base,
      driver,
      seatsLeft: seats - taken,
      recommendedPrice: null,
      hasMeetingPoint: facts.meetingPoint !== null,
      status: 'active',
    };
  };
  const addTrip = (extra: Partial<TripFacts> = {}) => {
    const facts: TripFacts = {
      id: newId(),
      driverId: DRIVER,
      from: '1726273',
      to: '1718401',
      departAt: NOW + 30 * HOUR,
      endsAt: NOW + 37 * HOUR,
      km: 300,
      seats: 3,
      price: 90_000,
      live: true,
      over: false,
      meetingPoint: { lat: 41.3, lng: 69.2 },
      plate: '01A123BC',
      ...extra,
    };
    trips.set(facts.id, facts);
    return facts.id;
  };
  const deps: BookingsDeps = {
    bookings,
    offers: createMemoryOffers(),
    trips: {
      find: async (tripId) => trips.get(tripId),
      ofDriver: async (driverId) =>
        [...trips.values()].filter((t) => t.driverId === driverId).map((t) => t.id),
      views: async (ids) => Promise.all(ids.flatMap((tripId) => trips.get(tripId) ?? []).map(view)),
      publish: async (driverId, input) => {
        const tripId = addTrip({ ...input, driverId, meetingPoint: null });
        return { ok: true, value: await view(trips.get(tripId) as TripFacts) };
      },
      cancel: async (_driverId, tripId) => void notes.push(`trip cancelled ${tripId}`),
    },
    requests: {
      find: async (requestId) => requests.get(requestId),
      ofPassenger: async (passengerId) => [...requests.values()].filter((r) => r.passengerId === passengerId),
      matched: async (requestId) => {
        const request = requests.get(requestId);
        if (request) requests.set(requestId, { ...request, open: false });
      },
    },
    wallet: {
      commission: (price, seats) => commissionFor({ percent: 10, minPerSeat: 3000 }, price, seats),
      canAfford: (driverId, amount) => canAfford(walletDeps, driverId, amount),
      charge: (driverId, bookingId, amount) => charge(walletDeps, driverId, bookingId, amount),
      refund: (driverId, bookingId) => refund(walletDeps, driverId, bookingId),
    },
    people: { find: async (userId) => people.get(userId) },
    approvedCar: async (userId) => (userId === DRIVER && approved ? CAR : null),
    recommend: fakeRecommend,
    notify: fakeNotifier(notes),
    now: () => now,
    newId,
  };
  const addRequest = (extra: Partial<RequestFacts> = {}) => {
    const request: RequestFacts = {
      id: newId(),
      passengerId: DILNOZA,
      from: '1726273',
      to: '1718401',
      date: '2026-10-02',
      km: 300,
      seats: 2,
      open: true,
      ...extra,
    };
    requests.set(request.id, request);
    return request.id;
  };
  return {
    deps,
    notes,
    addTrip,
    addRequest,
    bonus: () => grantWelcome(walletDeps, DRIVER),
    wallet: () => walletDeps.wallet.operations(DRIVER),
    setNow: (next: number) => void (now = next),
    // A new face or car photo: the driver goes to the team's check again (docs/05).
    recheck: () => void (approved = false),
  };
}
