import { loadBrand } from '@platform/brands';
import type { TripInput } from '@platform/contracts';
import type { Bindings } from '../../env';
import { bookingStore } from '../bookings/infrastructure/store';
import { maskContacts } from '../chat';
import { approvedCar } from '../drivers';
import { placesOf, roadKmBetween } from '../locations';
import { recommendationFor } from '../pricing';
import { peopleOf } from '../users';
import { pitakOf } from '../pitaks';
import type { TripEvent, TripsDeps } from './application/ports';
import { publishTrip } from './application/publish';
import { realPrices } from './application/prices';
import { cancelTrip } from './application/read';
import { views } from './application/views-of';
import { familyView, upcomingOf } from './application/driver-trips';
import { scheduleError } from './application/schedule';
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
  roadKm: (from, to) => roadKmBetween(env, from, to),
  schedule: loadBrand(env.BRAND).schedule,
  places: () => placesOf(env),
  announce: telegramAnnouncer({
    fetch: (input, init) => fetch(input, init),
    driverToken: env.DRIVER_BOT_TOKEN,
    placeName: async (id) => (await placesOf(env)).get(id)?.name ?? id,
  }),
  pitakOf: (from, to) => pitakOf(env, from, to),
  changed: (tripId, event) => onChange(env, tripId, event),
  mask: (text) => maskContacts(text).text,
  newId: () => crypto.randomUUID(),
  now: Date.now,
});

export const tripsModule = tripRoutes(tripsDeps);

// The Cron job (docs/35): trips over by now become completed.
export const completeTrips = (env: Bindings, now: number) => tripsDeps(env).trips.completeOver(now);

// For bookings (G08): the facts of a trip, the views, a trip from an accepted offer, a cancel.
export const tripFacts = async (env: Bindings, id: string) => {
  const trip = await tripsDeps(env).trips.find(id);
  if (!trip) return undefined;
  const now = Date.now();
  const { driverId, from, to, departAt, km, seats, price, pickupMode } = trip;
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
    pickupMode,
    plate: trip.car?.plate ?? null,
    endsAt,
    live: isLive(trip, now),
    over,
  };
};
export const driverTripIds = async (env: Bindings, driverId: number) =>
  (await tripsDeps(env).trips.byDriver(driverId)).map((trip) => trip.id);
// An offer becomes a trip when it is accepted: the driver hears the schedule now (docs/103).
export const scheduleErrorFor = (
  env: Bindings,
  driverId: number,
  trip: { from: string; to: string; departAt: number; km: number },
) => scheduleError(tripsDeps(env), driverId, trip);
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

// The driver's trip as the family sees it when the driver shares it (G18, docs/43).
export const tripForFamily = (env: Bindings, id: string) => familyView(tripsDeps(env), id);
// Trips of saved drivers that still take passengers (G18, docs/18).
export const upcomingTripsOf = (env: Bindings, driverIds: readonly number[]) =>
  upcomingOf(tripsDeps(env), driverIds);

// Real prices of trips that left, not cancelled: the team's median hint (docs/09).
export const realPricesSince = (env: Bindings, from: number) => realPrices(tripsDeps(env), from);
