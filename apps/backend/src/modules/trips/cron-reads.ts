import { HOUR_MS, lastDepart } from '@platform/contracts';
import type { Bindings } from '../../env';
import { tripsDeps } from './deps';

// The Cron job (G63, docs/35): live trips without «Yoʻlga chiqdim» whose time, the end of a range
// (docs/216), is in [from, to], and the departure the Cron writes by itself.
export const tripsNotDeparted = async (env: Bindings, from: number, to: number) => {
  const deps = tripsDeps(env);
  const longest = deps.schedule.rangeMaxHours * HOUR_MS;
  return (await deps.trips.notDeparted(from, to, longest)).map((trip) => ({
    id: trip.id,
    driverId: trip.driverId,
    departAt: lastDepart(trip),
  }));
};
export const departByCron = async (env: Bindings, tripId: string, at: number) => {
  await tripsDeps(env).trips.depart(tripId, at);
};

// The hourly repair of seats (G89 T2): cancelled trips leaving after this time.
export const cancelledTripsAfter = (env: Bindings, after: number) =>
  tripsDeps(env).trips.cancelledAfter(after);
