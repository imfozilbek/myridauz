// Test helper: bookings over fake trips and requests, with the real wallet in memory (docs/12).
import type { Car, Trip } from '@platform/contracts';
import { commissionFor } from '@platform/brands';
import { canAfford, charge, grantWelcome, refund } from '../wallet/application/wallet';
import type { WalletDeps } from '../wallet/application/ports';
import { createMemoryWallet } from '../wallet/infrastructure/memory-wallet';
import type { BookingsDeps, TripFacts } from './application/ports';
import type { RequestFacts } from './application/request-facts';
import { createMemoryBookings, createMemoryOffers } from './infrastructure/memory-bookings';
import {
  DRIVER,
  fakeNotifier,
  fakePeople,
  fakePlaces,
  fakeRecommend,
  fakeRequest,
  fakeTripView,
  NOW,
  PITAK,
  scheduleCheck,
} from './test-fakes';
import { idOfPublic } from '../../test-people';
import { fakeMeeting } from './test-meeting';

export const HOUR = 60 * 60 * 1000;
const CAR: Car = { make: 'Chevrolet', model: 'Cobalt', color: 'white', plate: '01A123BC', seats: 4 };
export { ALI, AWAY, DILNOZA, DRIVER, HOME, NOW, OLIM, PITAK, SCHEDULE, seats } from './test-fakes';

export function setup() {
  let now = NOW;
  let approved = true;
  let id = 0;
  const newId = () => `00000000-0000-0000-0000-${String((id += 1)).padStart(12, '0')}`;
  const people = fakePeople();
  const trips = new Map<string, TripFacts>();
  const requests = new Map<string, RequestFacts>();
  const notes: string[] = [];
  const close = (requestId: string, passengerId?: number) => {
    const request = requests.get(requestId);
    if (request && (passengerId ?? request.passengerId) === request.passengerId)
      requests.set(requestId, { ...request, open: false });
  };
  const walletDeps: WalletDeps = {
    wallet: createMemoryWallet(),
    promo: { amount: 500_000, grants: 3, days: 30, windowDays: 90 },
    people: { find: async (userId) => people.get(userId), idOf: idOfPublic },
    passengers: async () => new Map(),
    now: () => now,
    newId,
  };
  const bookings = createMemoryBookings();
  const view = async (facts: TripFacts): Promise<Trip> => {
    const taken = (await bookings.byTrips([facts.id]))
      .filter((booking) => booking.status === 'confirmed')
      .reduce((sum, booking) => sum + booking.seats, 0);
    return fakeTripView(facts, taken);
  };
  const addTrip = (extra: Partial<TripFacts> = {}) => {
    const facts: TripFacts = {
      id: newId(),
      driverId: DRIVER,
      from: '1726273',
      to: '1718401',
      departAt: NOW + 30 * HOUR,
      departedAt: null,
      arrivedAt: null,
      endsAt: NOW + 37 * HOUR,
      km: 300,
      seats: 3,
      price: 90_000,
      live: true,
      over: false,
      pickupMode: 'both',
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
      scheduleError: async (driverId, trip) => scheduleCheck(trip.departAt, now, trips.values(), driverId),
      views: async (ids) => Promise.all(ids.flatMap((tripId) => trips.get(tripId) ?? []).map(view)),
      publish: async (driverId, input) => {
        const tripId = addTrip({ ...input, driverId });
        return { ok: true, value: await view(trips.get(tripId) as TripFacts) };
      },
      cancel: async (_driverId, tripId) => void notes.push(`trip cancelled ${tripId}`),
    },
    requests: {
      find: async (requestId) => requests.get(requestId),
      ofPassenger: async (passengerId) => [...requests.values()].filter((r) => r.passengerId === passengerId),
      matched: async (requestId) => close(requestId),
      cancel: async (passengerId, requestId) => close(requestId, passengerId),
    },
    wallet: {
      commission: (price, seats) => commissionFor({ percent: 10, minPerSeat: 3000 }, price, seats),
      canAfford: (driverId, amount) => canAfford(walletDeps, driverId, amount),
      charge: (driverId, bookingId, amount) => charge(walletDeps, driverId, bookingId, amount),
      refund: (driverId, bookingId) => refund(walletDeps, driverId, bookingId),
    },
    people: { find: async (userId) => people.get(userId) },
    approvedCar: async (userId) => (userId === DRIVER && approved ? CAR : null),
    ratings: async () => new Map(),
    rated: async () => new Set(),
    recommend: fakeRecommend,
    notify: fakeNotifier(notes),
    track: (step) => void notes.push(`step: ${step}`),
    places: fakePlaces,
    pitak: async (pitakId) => (pitakId === PITAK.id ? PITAK : null),
    meeting: fakeMeeting(notes),
    now: () => now,
    newId,
  };
  const addRequest = (extra: Partial<RequestFacts> = {}) => {
    const request: RequestFacts = { ...fakeRequest(newId()), ...extra };
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
    // The driver spent part of the bonus on earlier trips.
    spend: (amount: number) => charge(walletDeps, DRIVER, newId(), amount),
    setNow: (next: number) => void (now = next),
    // «Yoʻlga chiqdim» of the driver before the time of the trip (G63).
    departEarly: (tripId: string) => {
      const facts = trips.get(tripId);
      if (facts) trips.set(tripId, { ...facts, departedAt: now });
    },
    // «Yetib keldik» of the driver: the trip is not closed yet (G63).
    arrive: (tripId: string) => {
      const facts = trips.get(tripId);
      if (facts) trips.set(tripId, { ...facts, departedAt: facts.departedAt ?? now, arrivedAt: now });
    },
    requestOpen: (requestId: string) => requests.get(requestId)?.open,
    // A new face or car photo: the driver goes to the team's check again (docs/05).
    recheck: () => void (approved = false),
  };
}
