import type { Bindings } from '../../env';
import { tripsDeps } from './deps';

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

// The hourly repair of seats (G89 T2): cancelled trips leaving after this time.
export const cancelledTripsAfter = (env: Bindings, after: number) =>
  tripsDeps(env).trips.cancelledAfter(after);
