import { DAY_MS, tashkentDate, type Booking, type Trip } from '@platform/contracts';
import { tripStage } from '../own-trip/trip-stage';

// What the main screen of a driver tells now (G66, docs/118, mockup g66/2): the trip of today, the
// next one, how many trips the week holds.
const live = (trips: readonly Trip[], now: number) =>
  trips
    .filter((trip) => trip.status !== 'cancelled' && tripStage(trip, now) !== 'over')
    .sort((a, b) => a.departAt - b.departAt);

// The trip of today, not over: its big card and «Yoʻlga chiqdim» (mockup g66/2 phone 4).
export const todayTrip = (trips: readonly Trip[], now: number): Trip | undefined =>
  live(trips, now).find((trip) => tashkentDate(trip.departAt) === tashkentDate(now));

// The next trip on a later day: its card with the seats and the new requests (phone 3).
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

// The people of a trip: the confirmed seats and the requests still waiting for the driver.
export function tripPeople(trip: Trip, bookings: readonly Booking[]) {
  const own = bookings.filter((booking) => booking.trip.id === trip.id);
  return {
    confirmed: own.filter((booking) => booking.status === 'confirmed'),
    waiting: own.filter((booking) => booking.status === 'requested').length,
  };
}
