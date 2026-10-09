// Test helper: the trips port of the bookings module over trips in memory (docs/35).
import type { BookingRule, Trip } from '@platform/contracts';
import type { BookingRepository, BookingsDeps, TripFacts } from './application/ports';
import { DRIVER, fakeTripView, NOW, scheduleCheck } from './test-fakes';

const HOUR = 60 * 60 * 1000;
type Extra = { bookingRule: BookingRule; private: boolean };

export function fakeTrips(
  bookings: BookingRepository,
  newId: () => string,
  now: () => number,
  notes: string[],
) {
  const trips = new Map<string, TripFacts>();
  const extras = new Map<string, Extra>();
  const view = async (facts: TripFacts): Promise<Trip> => {
    const taken = (await bookings.byTrips([facts.id]))
      .filter((booking) => booking.status === 'confirmed')
      .reduce((sum, booking) => sum + booking.seats, 0);
    return { ...fakeTripView(facts, taken), ...(extras.get(facts.id) ?? {}) };
  };
  const addTrip = (extra: Partial<TripFacts & Extra> = {}) => {
    const { bookingRule = 'seats', private: hidden = false, ...rest } = extra;
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
      ...rest,
    };
    trips.set(facts.id, facts);
    extras.set(facts.id, { bookingRule, private: hidden });
    return facts.id;
  };
  const published = async (tripId: string) => ({
    ok: true as const,
    value: await view(trips.get(tripId) as TripFacts),
  });
  const port: BookingsDeps['trips'] = {
    find: async (tripId) => trips.get(tripId),
    ofDriver: async (driverId) => [...trips.values()].filter((t) => t.driverId === driverId).map((t) => t.id),
    scheduleError: async (driverId, trip) => scheduleCheck(trip.departAt, now(), trips.values(), driverId),
    views: async (ids) => Promise.all(ids.flatMap((tripId) => trips.get(tripId) ?? []).map(view)),
    publish: async (driverId, input) =>
      published(addTrip({ ...input, driverId, bookingRule: input.bookingRule ?? 'seats' })),
    publishPrivate: async (driverId, input) => {
      const busy = scheduleCheck(input.departAt, now(), trips.values(), driverId);
      return busy
        ? { ok: false, error: busy }
        : published(
            addTrip({ ...input, driverId, bookingRule: input.bookingRule ?? 'seats', private: true }),
          );
    },
    open: async (_driverId, tripId) => {
      const extra = extras.get(tripId);
      if (!extra?.private) return { ok: false, error: 'trips.wrong_status' };
      extras.set(tripId, { ...extra, private: false });
      notes.push(`trip opened ${tripId}`);
      return published(tripId);
    },
    release: async (tripId) => {
      const extra = extras.get(tripId);
      if (extra) extras.set(tripId, { ...extra, private: false });
    },
    cancel: async (_driverId, tripId) => void notes.push(`trip cancelled ${tripId}`),
  };
  return { trips, port, addTrip };
}
