import { DAY_MS, tashkentDayStart, type Trip, type TripSearch } from '@platform/contracts';
import { placeMatches, placesMatching } from '../../../shared/places/place-match';
import { cancel, isLive } from '../domain/trip';
import type { Result, TripsDeps } from './ports';
import { views } from './views-of';
import { byHourThenRating, markedFirst } from '../domain/search-order';
import { upcomingFirst } from '../../../shared/order/upcoming-first';

// A passenger's search: the day in Tashkent, places or regions, "Mashinada ayol bor" (docs/06, docs/14).
// By the hour of departure; within the same hour a higher rating goes first (docs/24). People with
// complaints from 3 different people wait for the moderator out of the search (docs/17). The trips
// leaving soon and the cheaper ones are on top (G39, docs/104, 10).
// The own trips of the person are not in their search: they cannot book them (G41, docs/90 F-P8).
export async function searchTrips(deps: TripsDeps, search: TripSearch, viewer?: number): Promise<Trip[]> {
  const start = Math.max(tashkentDayStart(search.date), deps.now());
  const places = await deps.places();
  const end = tashkentDayStart(search.date) + DAY_MS;
  const trips = await deps.trips.leaving(start, end, placesMatching(search.from, places));
  const fits = trips.filter(
    (trip) =>
      trip.driverId !== viewer &&
      placeMatches(trip.from, search.from, places) &&
      placeMatches(trip.to, search.to, places),
  );
  // A full trip is not in the search: nothing to book there.
  const hidden = await deps.hidden([...new Set(fits.map((trip) => trip.driverId))]);
  const shown = fits.filter((trip) => !hidden.has(trip.driverId));
  const found = (await views(deps, shown)).filter((trip) => trip.seatsLeft > 0).sort(byHourThenRating);
  return markedFirst(search.woman ? found.filter((trip) => trip.woman) : found, deps.now());
}

// A trip opened for one request is its driver's only (G64): its passenger sees the offer instead.
export async function tripDetail(deps: TripsDeps, id: string, viewer: number): Promise<Trip | undefined> {
  const trip = await deps.trips.find(id);
  if (!trip || (trip.forRequest !== null && trip.driverId !== viewer)) return undefined;
  return (await views(deps, [trip]))[0];
}

// The team looks at the trips day by day; nothing waits for its approval (owner decision 29.09.2026).
// A day is far below the limit: it only guards the Worker (docs/90 F-A6).
const TEAM_DAY_LIMIT = 1000;
export async function teamTrips(deps: TripsDeps, date: string): Promise<Trip[]> {
  const start = tashkentDayStart(date);
  return views(deps, await deps.trips.between(start, start + DAY_MS, TEAM_DAY_LIMIT));
}

// "Mening safarlarim" reads the newest trips only; the older ones are in "Safarlar tarixi" (G42).
export const MY_TRIPS_LIMIT = 100;

// "Mening safarlarim" of a driver: the trips ahead first, then the past ones (docs/65 B6).
export async function myTrips(deps: TripsDeps, driverId: number): Promise<Trip[]> {
  const trips = await deps.trips.latestOf(driverId, MY_TRIPS_LIMIT);
  const now = deps.now();
  // A live trip on the road stays on top until it arrives (docs/90 F-D3).
  const until = (trip: (typeof trips)[number]) => (isLive(trip, now) ? trip.endsAt : trip.departAt);
  return views(
    deps,
    upcomingFirst(trips, (trip) => trip.departAt, now, until),
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
  // A «Yoʻlga chiqdim» between the read and the write keeps the trip on the road (G63).
  if (!(await deps.trips.cancel(id))) return { ok: false, error: 'trips.wrong_status' };
  await deps.changed(id, 'updated');
  const [view] = await views(deps, [next]);
  return view ? { ok: true, value: view } : { ok: false, error: 'trips.not_found' };
}
