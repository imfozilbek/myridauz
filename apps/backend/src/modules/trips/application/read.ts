import { DAY_MS, tashkentDate, tashkentDayStart, type Trip, type TripSearch } from '@platform/contracts';
import type { Person } from '../../users';
import { placeMatches } from '../../../shared/places/place-match';
import { cancel, type TripRecord } from '../domain/trip';
import type { Result, TripsDeps } from './ports';
import { NO_RIDERS, tripView, type Riders } from './views';

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

// The recommended price of each route once: shown next to the driver's price (docs/40, question 44).
async function recommendedOf(deps: TripsDeps, trips: readonly TripRecord[]): Promise<Map<string, number>> {
  const routes = [...new Set(trips.map((trip) => `${trip.from}:${trip.to}`))];
  const prices = await Promise.all(
    routes.map(async (route) => {
      const [from = '', to = ''] = route.split(':');
      const found = await deps.recommend(from, to);
      return found.ok ? ([route, found.value.price] as const) : null;
    }),
  );
  return new Map(prices.filter((price) => price !== null));
}

export async function views(deps: TripsDeps, trips: readonly TripRecord[]): Promise<Trip[]> {
  const now = deps.now();
  const [riders, ratings, recommended] = await Promise.all([
    ridersOf(deps, trips),
    deps.ratings([...new Set(trips.map((trip) => trip.driverId))]),
    recommendedOf(deps, trips),
  ]);
  const drivers = new Map<number, Promise<Person | undefined>>();
  const driverOf = (id: number) => {
    const known = drivers.get(id);
    if (known) return known;
    const loading = deps.people.find(id);
    drivers.set(id, loading);
    return loading;
  };
  const found = await Promise.all(
    trips.map(async (trip) => {
      // The car kept in the trip: a new check of the driver hides nothing (docs/65 A1).
      const [driver, car] = [await driverOf(trip.driverId), trip.car];
      if (!driver || !car) return null;
      const price = recommended.get(`${trip.from}:${trip.to}`) ?? null;
      return tripView(
        trip,
        driver,
        car,
        now,
        riders.get(trip.id) ?? NO_RIDERS,
        ratings.get(trip.driverId),
        price,
      );
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
