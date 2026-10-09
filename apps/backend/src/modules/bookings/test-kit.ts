// Test helper: bookings over fake trips and requests, with the real wallet in memory (docs/12).
import { loadBrand } from '@platform/brands';
import type { Car } from '@platform/contracts';
import { maskContacts } from '../chat';
import { commissionFor } from '@platform/brands';
import { canAfford, charge, grantWelcome, refund } from '../wallet/application/wallet';
import type { WalletDeps } from '../wallet/application/ports';
import { createMemoryWallet } from '../wallet/infrastructure/memory-wallet';
import type { BookingsDeps } from './application/ports';
import type { RequestFacts } from './application/request-facts';
import { createMemoryBookings, createMemoryOffers } from './infrastructure/memory-bookings';
import { createMemoryTalks } from './infrastructure/memory-talks';
import { fakeRequest, fakeRequestView } from './test-requests';
import { fakeTrips } from './test-trips';
import { DRIVER, fakeNotifier, fakePeople, fakePlaces, fakeRecommend, NOW, PITAK } from './test-fakes';
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
  const { trips, port, addTrip } = fakeTrips(bookings, newId, () => now, notes);
  const deps: BookingsDeps = {
    bookings,
    offers: createMemoryOffers(),
    talks: createMemoryTalks(),
    requestRings: loadBrand().calls.requestRings,
    trips: port,
    requests: {
      find: async (requestId) => requests.get(requestId),
      view: async (requestId) => fakeRequestView(requests.get(requestId)),
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
    mask: (text) => maskContacts(text).text,
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
    // The request closed: cancelled by the passenger or over (docs/35).
    close: (requestId: string) => close(requestId),
    // A new face or car photo: the driver goes to the team's check again (docs/05).
    recheck: () => void (approved = false),
  };
}
