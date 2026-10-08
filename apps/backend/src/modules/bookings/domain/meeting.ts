import { MEET_BEFORE_MINUTES, type DriverMeetStep } from '@platform/contracts';
import type { BookingRecord } from './booking';

const MINUTE_MS = 60 * 1000;

// The meeting opens MEET_BEFORE_MINUTES before the departure and closes with the trip (docs/129).
export const meetingOpen = (trip: { departAt: number; endsAt: number; over: boolean }, now: number) =>
  !trip.over && now >= trip.departAt - MEET_BEFORE_MINUTES * MINUTE_MS && now < trip.endsAt;

type MarkError = 'bookings.already_met' | 'bookings.already_no_show';

// The driver at the point of the passenger (docs/126, G63): «Men keldim», then «Keldi» or «Kelmadi».
// «Keldi» and «Kelmadi» exclude each other and are set once; «Men keldim» again changes nothing.
// null: nothing to change.
export function mark(
  booking: BookingRecord,
  step: DriverMeetStep,
  now: number,
): BookingRecord | MarkError | null {
  if (booking.noShowAt !== null) return 'bookings.already_no_show';
  if (step === 'came')
    return booking.driverCameAt === null && booking.metAt === null ? stamp(booking, step, now) : null;
  if (booking.metAt !== null) return 'bookings.already_met';
  return stamp(booking, step, now);
}

const COLUMN = { came: 'driverCameAt', met: 'metAt', no_show: 'noShowAt' } as const;
const stamp = (booking: BookingRecord, step: DriverMeetStep, now: number): BookingRecord => ({
  ...booking,
  [COLUMN[step]]: now,
  updatedAt: now,
});

// A passenger who did not come rode nothing: no rating, no history, no ride count (docs/129).
export const showedUp = (booking: BookingRecord) => booking.noShowAt === null;
