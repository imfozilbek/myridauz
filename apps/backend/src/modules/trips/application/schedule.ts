import { earliestDepart, tripHolds, type Schedule } from '@platform/contracts';
import type { TripsDeps } from './ports';

export type ScheduleError = 'trips.too_soon' | 'trips.too_many';

type Deps = Pick<TripsDeps, 'trips' | 'schedule' | 'now'>;

// One live trip of a driver at a time (owner decision 12.10.2026, docs/172): with one the schedule is
// full. A trip after «Yetib keldik» is over for it: the way back may leave today (G78 В11).
export async function driverSchedule(deps: Deps, driverId: number): Promise<Schedule> {
  const now = deps.now();
  return { full: (await deps.trips.byDriver(driverId)).some((trip) => tripHolds(trip, now)) };
}

// A new trip of the driver: at least the lead time ahead (G38, docs/103) and no other live trip.
export async function scheduleError(
  deps: Deps,
  driverId: number,
  departAt: number,
): Promise<ScheduleError | null> {
  if (departAt < earliestDepart(deps.now(), deps.schedule)) return 'trips.too_soon';
  return (await driverSchedule(deps, driverId)).full ? 'trips.too_many' : null;
}
