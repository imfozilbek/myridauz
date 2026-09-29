import type { TripInput } from '@platform/contracts';
import type { Bindings } from '../../env';
import { bookingStore } from '../bookings/infrastructure/store';
import { approvedCar } from '../drivers';
import { placesOf } from '../locations';
import { recommendationFor } from '../pricing';
import { peopleOf } from '../users';
import type { TripEvent, TripsDeps } from './application/ports';
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

// What follows a published or changed trip (channel posts, route subscriptions): set by the app,
// which knows every module (app.ts), so trips does not depend on them.
type ChangeHandler = (env: Bindings, tripId: string, event: TripEvent) => Promise<void>;
let onChange: ChangeHandler = async () => undefined;
export const handleTripChange = (handler: ChangeHandler) => void (onChange = handler);
// A booking was confirmed or cancelled: the seats left changed (G08).
export const tripChanged = (env: Bindings, tripId: string) => onChange(env, tripId, 'updated');

// Ratings and complaints come from their modules, set by the app (module-events.ts), G11.
type Standing = Pick<TripsDeps, 'ratings' | 'hidden'>;
type StandingOf = (env: Bindings) => Standing;
let standingOf: StandingOf = () => ({ ratings: async () => new Map(), hidden: async () => new Set() });
export const wireTripStanding = (next: StandingOf) => void (standingOf = next);

const tripsDeps = (env: Bindings): TripsDeps => ({
  trips: env.DB ? d1Trips(env.DB) : localTrips,
  riders: async (tripIds) =>
    (await bookingStore(env).byTrips(tripIds)).filter((booking) => booking.status === 'confirmed'),
  people: peopleOf(env),
  approvedCar: (driverId) => approvedCar(env, driverId),
  ...standingOf(env),
  recommend: (from, to) => recommendationFor(env, from, to),
  places: () => placesOf(env),
  announce: telegramAnnouncer({
    fetch: (input, init) => fetch(input, init),
    driverToken: env.DRIVER_BOT_TOKEN,
    placeName: async (id) => (await placesOf(env)).get(id)?.name ?? id,
  }),
  changed: (tripId, event) => onChange(env, tripId, event),
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
  const { endsAt } = trip;
  return {
    id,
    driverId,
    from,
    to,
    departAt,
    km,
    seats,
    price,
    meetingPoint,
    endsAt,
    live: isLive(trip, now),
    over,
  };
};
export const driverTripIds = async (env: Bindings, driverId: number) =>
  (await tripsDeps(env).trips.byDriver(driverId)).map((trip) => trip.id);
export const tripViewsOf = async (env: Bindings, ids: readonly string[]) => {
  const deps = tripsDeps(env);
  const found = await Promise.all(ids.map((id) => deps.trips.find(id)));
  return views(
    deps,
    found.filter((trip) => trip !== undefined),
  );
};
export const publishFor = (env: Bindings, driverId: number, input: Required<TripInput>) =>
  publishTrip(tripsDeps(env), driverId, input);
export const cancelFor = async (env: Bindings, driverId: number, tripId: string) => {
  await cancelTrip(tripsDeps(env), driverId, tripId);
};

// Trips with riders that leave soon: the reminders of the Cron job (G10).
export const tripsDeparting = async (env: Bindings, from: number, to: number) =>
  tripViewsOf(
    env,
    (await tripsDeps(env).trips.departing(from, to)).map((trip) => trip.id),
  );

// Trips that ended in [from, to): the ratings ask their riders (docs/24, G11).
export const tripsEnded = async (env: Bindings, from: number, to: number) =>
  (await tripsDeps(env).trips.ended(from, to)).map(({ id, driverId, departAt, endsAt }) => ({
    id,
    driverId,
    departAt,
    endsAt,
  }));
