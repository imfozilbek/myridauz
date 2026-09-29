import {
  DAY_MS,
  tashkentDate,
  tashkentDayStart,
  type Car,
  type Trip,
  type TripSearch,
} from '@platform/contracts';
import type { Person } from '../../users';
import { placeMatches } from '../../../shared/places/place-match';
import { cancel, type TripRecord } from '../domain/trip';
import type { Result, TripsDeps } from './ports';
import { NO_RIDERS, tripView, type Riders } from './views';

type DriverInfo = readonly [Person | undefined, Car | null];

// Views of many trips: the driver and the car are read once per driver.
async function ridersOf(deps: TripsDeps, trips: readonly TripRecord[]): Promise<Map<string, Riders>> {
  const riders = await deps.riders(trips.map((trip) => trip.id));
  const women = await Promise.all(
    riders.map(async (rider) => (await deps.people.find(rider.passengerId))?.gender === 'female'),
  );
  const byTrip = new Map<string, Riders>();
  riders.forEach((rider, index) => {
    const known = byTrip.get(rider.tripId) ?? { seats: 0, woman: false };
    byTrip.set(rider.tripId, {
      seats: known.seats + rider.seats,
      woman: known.woman || women[index] === true,
    });
  });
  return byTrip;
}

export async function views(deps: TripsDeps, trips: readonly TripRecord[]): Promise<Trip[]> {
  const now = deps.now();
  const [riders, ratings] = await Promise.all([
    ridersOf(deps, trips),
    deps.ratings([...new Set(trips.map((trip) => trip.driverId))]),
  ]);
  const drivers = new Map<number, Promise<DriverInfo>>();
  const driverOf = (id: number) => {
    const known = drivers.get(id);
    if (known) return known;
    const loading = Promise.all([deps.people.find(id), deps.approvedCar(id)] as const);
    drivers.set(id, loading);
    return loading;
  };
  const found = await Promise.all(
    trips.map(async (trip) => {
      const [driver, car] = await driverOf(trip.driverId);
      if (!driver || !car) return null;
      return tripView(trip, driver, car, now, riders.get(trip.id) ?? NO_RIDERS, ratings.get(trip.driverId));
    }),
  );
  return found.filter((trip) => trip !== null);
}

// A passenger's search: the day in Tashkent, places or regions, "Mashinada ayol bor" (docs/06, docs/14).
// By the hour of departure; within the same hour a higher rating goes first (docs/24). People with
// complaints from 3 different people wait for the moderator out of the search (docs/17).
export async function searchTrips(deps: TripsDeps, search: TripSearch): Promise<Trip[]> {
  const start = Math.max(tashkentDayStart(search.date), deps.now());
  const [trips, places] = await Promise.all([
    deps.trips.leaving(start, tashkentDayStart(search.date) + DAY_MS),
    deps.places(),
  ]);
  const fits = trips.filter(
    (trip) => placeMatches(trip.from, search.from, places) && placeMatches(trip.to, search.to, places),
  );
  // A full trip is not in the search: nothing to book there.
  const hidden = await deps.hidden([...new Set(fits.map((trip) => trip.driverId))]);
  const shown = fits.filter((trip) => !hidden.has(trip.driverId));
  const found = (await views(deps, shown)).filter((trip) => trip.seatsLeft > 0).sort(byHourThenRating);
  return search.woman ? found.filter((trip) => trip.woman) : found;
}

const HOUR_MS = 60 * 60 * 1000;
const byHourThenRating = (a: Trip, b: Trip) =>
  Math.floor(a.departAt / HOUR_MS) - Math.floor(b.departAt / HOUR_MS) ||
  (b.driver.rating.average ?? 0) - (a.driver.rating.average ?? 0) ||
  a.departAt - b.departAt;

export async function tripDetail(deps: TripsDeps, id: string): Promise<Trip | undefined> {
  const trip = await deps.trips.find(id);
  return trip ? (await views(deps, [trip]))[0] : undefined;
}

// The team looks at the trips from yesterday on; nothing waits for its approval (owner decision 29.09.2026).
const TEAM_LIST_LIMIT = 200;
export async function teamTrips(deps: TripsDeps): Promise<Trip[]> {
  const yesterday = tashkentDayStart(tashkentDate(deps.now() - DAY_MS));
  return views(deps, await deps.trips.since(yesterday, TEAM_LIST_LIMIT));
}

// "Mening safarlarim" of a driver: the newest first.
export async function myTrips(deps: TripsDeps, driverId: number): Promise<Trip[]> {
  const trips = await deps.trips.byDriver(driverId);
  return views(
    deps,
    [...trips].sort((a, b) => b.departAt - a.departAt),
  );
}

export async function cancelTrip(
  deps: TripsDeps,
  driverId: number,
  id: string,
): Promise<Result<Trip, 'trips.not_found' | 'trips.wrong_status'>> {
  const trip = await deps.trips.find(id);
  if (!trip) return { ok: false, error: 'trips.not_found' };
  const next = cancel(trip, driverId, deps.now());
  if (typeof next === 'string') return { ok: false, error: next };
  await deps.trips.save(next);
  await deps.changed(id, 'updated');
  const [view] = await views(deps, [next]);
  return view ? { ok: true, value: view } : { ok: false, error: 'trips.not_found' };
}
