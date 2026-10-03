import {
  arrivalAt,
  busyWindows,
  earliestDepart,
  isBusy,
  roadMs,
  type Schedule,
} from '@platform/contracts';
import { isLive } from '../domain/trip';
import type { TripsDeps } from './ports';

export type ScheduleError = 'trips.too_soon' | 'trips.too_many' | 'trips.busy';

type Deps = Pick<TripsDeps, 'trips' | 'roadKm' | 'schedule' | 'now'>;
type Route = { readonly from: string; readonly to: string; readonly km: number };

// The busy times of the driver for a new trip on this route (G38, docs/103): the driver must make it
// from the end of each trip to its start and from its end to the next trip, with time to gather people.
export async function driverSchedule(deps: Deps, driverId: number, route: Route): Promise<Schedule> {
  const now = deps.now();
  const live = (await deps.trips.byDriver(driverId)).filter((trip) => isLive(trip, now));
  const pairs = live.flatMap((trip) => [
    [route.to, trip.from],
    [trip.to, route.from],
  ]);
  const kms = new Map(
    await Promise.all(
      pairs.map(async ([from = '', to = '']) => [`${from}>${to}`, await deps.roadKm(from, to)] as const),
    ),
  );
  const planned = live.map((trip) => ({ ...trip, arriveAt: arrivalAt(trip.departAt, trip.km) }));
  const windows = busyWindows(
    planned,
    { from: route.from, to: route.to, roadMs: roadMs(route.km) },
    (from, to) => roadMs(kms.get(`${from}>${to}`) ?? 0),
    deps.schedule,
  );
  return { windows, full: live.length >= deps.schedule.maxActiveTrips };
}

// A new trip of the driver: at least the lead time ahead, within the limit, and one the driver makes.
export async function scheduleError(
  deps: Deps,
  driverId: number,
  trip: Route & { readonly departAt: number },
): Promise<ScheduleError | null> {
  if (trip.departAt < earliestDepart(deps.now(), deps.schedule)) return 'trips.too_soon';
  const { windows, full } = await driverSchedule(deps, driverId, trip);
  if (full) return 'trips.too_many';
  return isBusy(trip.departAt, windows) ? 'trips.busy' : null;
}
