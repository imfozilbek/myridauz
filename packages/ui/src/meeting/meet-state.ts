import { MEET_BEFORE_MINUTES, tripEndsAt, type Booking, type Trip } from '@platform/contracts';
import { stopsInOrder } from '../bookings/driver-stops';

const MINUTE_MS = 60 * 1000;

export type MeetStep = 'come' | 'answer' | 'met' | 'no_show';

// Where the driver is with one passenger at the point (docs/126): «Men keldim», then «Keldi» or
// «Kelmadi». A passenger in the car by the own «Mashinaga chiqdim» is met.
export function meetStep(booking: Booking): MeetStep {
  if (booking.noShowAt !== null) return 'no_show';
  if (booking.metAt !== null || booking.boardedAt !== null) return 'met';
  return booking.driverCameAt === null ? 'come' : 'answer';
}

// Not answered yet: «Men keldim», «Keldi» and «Kelmadi» are still there.
export const meetOpen = (booking: Booking) => {
  const step = meetStep(booking);
  return step === 'come' || step === 'answer';
};

// The meeting opens MEET_BEFORE_MINUTES before the departure and closes with the trip, as on the
// server (docs/129): «Kelmadi» is possible until then.
export const meetingOpen = (trip: Pick<Trip, 'departAt' | 'km' | 'status'>, now: number) =>
  (trip.status === 'active' || trip.status === 'full') &&
  now >= trip.departAt - MEET_BEFORE_MINUTES * MINUTE_MS &&
  now < tripEndsAt(trip.departAt, trip.km);

export type MeetPoint = { readonly booking: Booking; readonly number: number };

// The confirmed passengers by their points in the order of the way (G24): the people of one pitak
// share its number; a passenger without a point comes last.
export function meetingPoints(bookings: readonly Booking[]): MeetPoint[] {
  const riding = bookings.filter((booking) => booking.status === 'confirmed');
  const { pickups } = stopsInOrder(riding, null);
  const numberOf = (booking: Booking) => {
    const stop = booking.pitak ? `pitak:${booking.pitak.id}` : booking.id;
    const at = pickups.findIndex(({ id }) => id === stop);
    return (at === -1 ? pickups.length : at) + 1;
  };
  return riding
    .map((booking) => ({ booking, number: numberOf(booking) }))
    .sort((a, b) => a.number - b.number);
}
