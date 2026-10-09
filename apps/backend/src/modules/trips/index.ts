import { DAY_MS, type TripInput } from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../env';
import { openTrip, publishPrivateTrip, releaseTrip } from './application/private-trip';
import { publishOfferTrip, type Input } from './application/publish';
import { realPrices } from './application/prices';
import { cancelTrip, MY_TRIPS_LIMIT } from './application/read';
import { views } from './application/views-of';
import { familyView, upcomingOf } from './application/driver-trips';
import { scheduleError } from './application/schedule';
import { tripsDeps } from './deps';
import { progressRoutes } from './http/progress-routes';
import { tripRoutes } from './http/trip-routes';
import { isLive, statusAt } from './domain/trip';

export { handleTripChange, wireTripStanding } from './deps';
// A booking was confirmed or cancelled: the seats left changed (G08).
export const tripChanged = (env: Bindings, tripId: string) => tripsDeps(env).changed(tripId, 'updated');

export const tripsModule = new Hono<AppEnv>()
  .route('/', tripRoutes(tripsDeps))
  .route('/', progressRoutes(tripsDeps));

// The Cron job (docs/35): trips over by now become completed, and their live cards say so (G68).
export const completeTrips = async (env: Bindings, now: number) => {
  const deps = tripsDeps(env);
  for (const id of await deps.trips.completeOver(now)) await deps.changed(id, 'completed');
};

// For bookings (G08): the facts of a trip, the views, a trip from an accepted offer, a cancel.
export const tripFacts = async (env: Bindings, id: string) => {
  const trip = await tripsDeps(env).trips.find(id);
  if (!trip) return undefined;
  const now = Date.now();
  const { driverId, from, to, departAt, departedAt, arrivedAt, km, seats, price, pickupMode } = trip;
  const over = statusAt(trip, now) === 'completed';
  const { endsAt } = trip;
  return {
    id,
    driverId,
    from,
    to,
    departAt,
    departedAt,
    arrivedAt,
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
// The directions of a driver for the board of requests (G64): the routes of the trips of the last
// days, both ways (a driver goes back the same road).
const DIRECTION_DAYS = 60;
export const driverDirections = async (env: Bindings, driverId: number) => {
  const since = Date.now() - DIRECTION_DAYS * DAY_MS;
  const trips = (await tripsDeps(env).trips.latestOf(driverId, MY_TRIPS_LIMIT)).filter(
    (t) => t.departAt >= since,
  );
  return trips.flatMap(({ from, to }) => [
    { from, to },
    { from: to, to: from },
  ]);
};
// «≈ N joyga yetadi» of «Hamyon» counts at the seat price of the driver's last trip (G65).
export const lastTripPrice = async (env: Bindings, driverId: number) =>
  (await tripsDeps(env).trips.latestOf(driverId, 1))[0]?.price ?? null;
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
export const publishOfferTripFor = (
  env: Bindings,
  driverId: number,
  input: Omit<Required<TripInput>, 'pickupMode'>,
) => publishOfferTrip(tripsDeps(env), driverId, input);
// «Safar ochib taklif qilish» (G64): a trip for one request; opened for everybody or taken.
export const publishPrivateTripFor = (env: Bindings, driverId: number, input: Input, requestId: string) =>
  publishPrivateTrip(tripsDeps(env), driverId, input, requestId);
export const openTripFor = (env: Bindings, driverId: number, tripId: string) =>
  openTrip(tripsDeps(env), driverId, tripId);
export const releaseTripFor = (env: Bindings, tripId: string) => releaseTrip(tripsDeps(env), tripId);
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

// The Cron job (G63, docs/35): live trips without «Yoʻlga chiqdim» whose time is in [from, to], and
// the departure the Cron writes by itself.
export const tripsNotDeparted = async (env: Bindings, from: number, to: number) =>
  (await tripsDeps(env).trips.notDeparted(from, to)).map(({ id, driverId, departAt }) => ({
    id,
    driverId,
    departAt,
  }));
export const departByCron = async (env: Bindings, tripId: string, at: number) => {
  await tripsDeps(env).trips.depart(tripId, at);
};
