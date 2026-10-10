import { DAY_MS, tashkentDate, type Trip } from '@platform/contracts';
import { tripStage } from '../own-trip/trip-stage';

// What the tiles of a driver tell (G76, docs/165): the next trip, how many trips the week holds.
const live = (trips: readonly Trip[], now: number) =>
  trips
    .filter((trip) => trip.status !== 'cancelled' && tripStage(trip, now) !== 'over')
    .sort((a, b) => a.departAt - b.departAt);

// The next trip, not over.
export const nextTrip = (trips: readonly Trip[], now: number): Trip | undefined => live(trips, now)[0];

const WEEK_DAYS = 7;
// The days of this week from Monday, as a calendar counts them (Sunday is 0 for a date).
const weekFromMonday = (now: number) => {
  const sinceMonday = (new Date(`${tashkentDate(now)}T12:00:00Z`).getUTCDay() + WEEK_DAYS - 1) % WEEK_DAYS;
  return Array.from({ length: WEEK_DAYS }, (_, day) => tashkentDate(now + (day - sinceMonday) * DAY_MS));
};

// «Bu hafta N ta safar»: the trips of this week, the ones made and the ones ahead (mockup g66/2).
export function weekTrips(trips: readonly Trip[], now: number): number {
  const week = new Set(weekFromMonday(now));
  return trips.filter((trip) => trip.status !== 'cancelled' && week.has(tashkentDate(trip.departAt))).length;
}
