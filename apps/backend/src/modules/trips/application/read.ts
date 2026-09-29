import { DAY_MS, tashkentDayStart, type Car, type Trip, type TripSearch } from '@platform/contracts';
import type { Person } from '../../users';
import { placeMatches } from '../../../shared/places/place-match';
import { cancel, type TripRecord } from '../domain/trip';
import type { Result, TripsDeps } from './ports';
import { tripView } from './views';

type DriverInfo = readonly [Person | undefined, Car | null];

// Views of many trips: the driver and the car are read once per driver.
async function views(deps: TripsDeps, trips: readonly TripRecord[]): Promise<Trip[]> {
  const now = deps.now();
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
      return driver && car ? tripView(trip, driver, car, now) : null;
    }),
  );
  return found.filter((trip) => trip !== null);
}

// A passenger's search: the day in Tashkent, places or regions, "Mashinada ayol bor" (docs/06, docs/14).
// The earliest first; drivers with a high rating go first once ratings exist (G14).
export async function searchTrips(deps: TripsDeps, search: TripSearch): Promise<Trip[]> {
  const start = Math.max(tashkentDayStart(search.date), deps.now());
  const [trips, places] = await Promise.all([
    deps.trips.leaving(start, tashkentDayStart(search.date) + DAY_MS),
    deps.places(),
  ]);
  const fits = trips.filter(
    (trip) => placeMatches(trip.from, search.from, places) && placeMatches(trip.to, search.to, places),
  );
  const found = await views(deps, fits);
  return search.woman ? found.filter((trip) => trip.woman) : found;
}

export async function tripDetail(deps: TripsDeps, id: string): Promise<Trip | undefined> {
  const trip = await deps.trips.find(id);
  return trip ? (await views(deps, [trip]))[0] : undefined;
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
  const [view] = await views(deps, [next]);
  return view ? { ok: true, value: view } : { ok: false, error: 'trips.not_found' };
}
