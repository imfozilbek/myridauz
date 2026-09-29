import type { TripInput } from '@platform/contracts';
import type { Bindings } from '../../env';
import { bookingStore } from '../bookings/infrastructure/store';
import { approvedCar } from '../drivers';
import { placesOf } from '../locations';
import { recommendationFor } from '../pricing';
import { peopleOf } from '../users';
import type { TripsDeps } from './application/ports';
import { publishTrip } from './application/publish';
import { cancelTrip, views } from './application/read';
import { setMeetingPoint } from './application/meeting-point';
import { tripRoutes } from './http/trip-routes';
import { d1Trips } from './infrastructure/d1-trips';
import { createMemoryTrips } from './infrastructure/memory-trips';
import { isLive, statusAt } from './domain/trip';
import { telegramAnnouncer } from './infrastructure/telegram-announcer';

// Without D1 (tests) trips live in memory.
const localTrips = createMemoryTrips();

const tripsDeps = (env: Bindings): TripsDeps => ({
  trips: env.DB ? d1Trips(env.DB) : localTrips,
  riders: async (tripIds) =>
    (await bookingStore(env).byTrips(tripIds)).filter((booking) => booking.status === 'confirmed'),
  people: peopleOf(env),
  approvedCar: (driverId) => approvedCar(env, driverId),
  recommend: (from, to) => recommendationFor(env, from, to),
  places: () => placesOf(env),
  announce: telegramAnnouncer({
    fetch: (input, init) => fetch(input, init),
    driverToken: env.DRIVER_BOT_TOKEN,
    placeName: async (id) => (await placesOf(env)).get(id)?.name ?? id,
  }),
  newId: () => crypto.randomUUID(),
  now: Date.now,
});

export const tripsModule = tripRoutes(tripsDeps);

// The Cron job (docs/35): trips over by now become completed.
// A location the driver sent to the driver bot as an answer to a trip message (docs/14).
export const meetingPointFromBot = (
  env: Bindings,
  driverId: number,
  messageId: number,
  lat: number,
  lng: number,
) => setMeetingPoint(tripsDeps(env), driverId, messageId, { lat, lng });

export const completeTrips = (env: Bindings, now: number) => tripsDeps(env).trips.completeOver(now);

// For bookings (G08): the facts of a trip, the views, a trip from an accepted offer, a cancel.
export const tripFacts = async (env: Bindings, id: string) => {
  const trip = await tripsDeps(env).trips.find(id);
  if (!trip) return undefined;
  const now = Date.now();
  const { driverId, from, to, departAt, km, seats, price, meetingPoint } = trip;
  const over = statusAt(trip, now) === 'completed';
  return { id, driverId, from, to, departAt, km, seats, price, meetingPoint, live: isLive(trip, now), over };
};
export const driverTripIds = async (env: Bindings, driverId: number) =>
  (await tripsDeps(env).trips.byDriver(driverId)).map((trip) => trip.id);
export const tripViewsOf = async (env: Bindings, ids: readonly string[]) => {
  const deps = tripsDeps(env);
  const found = await Promise.all(ids.map((id) => deps.trips.find(id)));
  return views(deps, found.filter((trip) => trip !== undefined));
};
export const publishFor = (env: Bindings, driverId: number, input: Required<TripInput>) =>
  publishTrip(tripsDeps(env), driverId, input);
export const cancelFor = async (env: Bindings, driverId: number, tripId: string) => {
  await cancelTrip(tripsDeps(env), driverId, tripId);
};
