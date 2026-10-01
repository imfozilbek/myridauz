import {
  commonModes,
  extraKm,
  FAR_EXTRA_KM,
  type Point,
  type Trip,
  type TripSearch,
} from '@platform/contracts';
import type { Rider, TripsDeps } from './ports';

// How a found trip suits the passenger (G24, docs/70): the way (the table of docs/70) and the
// extra km to the points of the passengers the driver already takes. Door beats pitak when both
// suit: then the extra way counts from the door, as the booking will.
function fitOf(trip: Trip, riders: readonly Rider[], search: TripSearch): NonNullable<Trip['fit']> {
  const mode = search.mode ?? 'both';
  const ways = commonModes(trip.pickupMode, mode).filter((way) => way === 'door' || trip.pitak !== null);
  if (ways.length === 0) return { matches: false, extraKm: null };
  const own = (key: 'pickup' | 'dropoff') => riders.flatMap((rider) => (rider[key] ? [rider[key]] : []));
  const stops = { pickups: own('pickup'), dropoffs: own('dropoff') };
  const pickup: Point | null = ways.includes('door') ? (search.pickup ?? null) : null;
  return { matches: true, extraKm: extraKm(stops, { pickup, dropoff: search.dropoff ?? null }) };
}

// Three groups: suits and near, suits but far (more than 10 km extra), another way; each group by
// the hour of departure, then the extra km. The order inside an hour stays the caller's.
const group = (trip: Trip) => {
  if (!trip.fit?.matches) return 2;
  return (trip.fit.extraKm ?? 0) > FAR_EXTRA_KM ? 1 : 0;
};
const HOUR_MS = 60 * 60 * 1000;

export async function withFit(deps: TripsDeps, trips: Trip[], search: TripSearch): Promise<Trip[]> {
  if (!search.mode) return trips;
  const riders = await deps.riders(trips.map((trip) => trip.id));
  const fitted = trips.map((trip) => ({
    ...trip,
    fit: fitOf(
      trip,
      riders.filter((rider) => rider.tripId === trip.id),
      search,
    ),
  }));
  const hour = (trip: Trip) => Math.floor(trip.departAt / HOUR_MS);
  return fitted
    .map((trip, index) => ({ trip, index }))
    .sort(
      (a, b) =>
        group(a.trip) - group(b.trip) ||
        hour(a.trip) - hour(b.trip) ||
        (a.trip.fit.extraKm ?? 0) - (b.trip.fit.extraKm ?? 0) ||
        a.index - b.index,
    )
    .map(({ trip }) => trip);
}
