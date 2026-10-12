import { DAY_MS, tripHolds, type Trip } from '@platform/contracts';
import { tripStage } from '../own-trip/trip-stage';

// «Mening safarlarim» of a driver (G64, docs/118 path 7, mockup g64/6): the trips that still live,
// the way back and the trip to repeat tomorrow (the week: days/week.ts).
// A trip the other way within two days of the first one is its way back.
const WAY_BACK_MS = 2 * DAY_MS;

// Live until it is over: past, cancelled or its time ended (the tab «Oʻtgan» takes the rest).
export const isLive = (trip: Trip, now: number) => tripStage(trip, now) !== 'over';

// «Qaytish safari»: the trip goes back the way of an earlier trip of the driver.
export const isWayBack = (trip: Trip, trips: readonly Trip[]) =>
  trips.some(
    (other) =>
      other.from === trip.to &&
      other.to === trip.from &&
      other.departAt < trip.departAt &&
      trip.departAt - other.departAt <= WAY_BACK_MS,
  );

// «Ertaga shu safar»: the last trip that already left, not cancelled, repeated tomorrow at its time;
// only while no trip is live, one at a time (owner decision 12.10.2026, docs/172).
export function tripToRepeat(trips: readonly Trip[], now: number): Trip | null {
  if (trips.some((trip) => tripHolds(trip, now))) return null;
  const left = trips.filter((trip) => trip.departAt <= now && trip.status !== 'cancelled');
  return left.reduce<Trip | null>(
    (last, trip) => (!last || trip.departAt > last.departAt ? trip : last),
    null,
  );
}
