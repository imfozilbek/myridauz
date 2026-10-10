import { meetingStartsAt, type DriverMeetStep } from '@platform/contracts';
import { holdsSeats, type BookingRecord } from './booking';

// The driver marks the meeting until the trip closes (docs/129).
export const meetingOpen = (
  trip: { departAt: number; endsAt: number; over: boolean },
  now: number,
  minutes: number,
) => !trip.over && now >= meetingStartsAt(trip.departAt, minutes) && now < trip.endsAt;

type MarkError = 'bookings.already_met' | 'bookings.already_no_show' | 'bookings.wrong_status';

// The driver at the point of the passenger (docs/126, G63): «Men keldim», then «Keldi» or «Kelmadi».
// «Keldi» and «Kelmadi» exclude each other and are set once; «Men keldim» again changes nothing.
// «Keldi» is the passenger in the car (G76, owner decision 10.10.2026, docs/43): the close people
// hear it. «Kelmadi» never after the passenger got in or said «Yetib keldim».
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
  if (step === 'no_show' && (booking.boardedAt !== null || booking.arrivedAt !== null))
    return 'bookings.wrong_status';
  return stamp(booking, step, now);
}

const COLUMN = { came: 'driverCameAt', met: 'metAt', no_show: 'noShowAt' } as const;
const stamp = (booking: BookingRecord, step: DriverMeetStep, now: number): BookingRecord => ({
  ...booking,
  [COLUMN[step]]: now,
  ...(step === 'met' ? { boardedAt: booking.boardedAt ?? now } : {}),
  updatedAt: now,
});

// A ride: the booking held seats and the passenger came. A passenger who did not come rode
// nothing: no rating, no history, no ride count (docs/129).
export const isRide = (booking: BookingRecord) => holdsSeats(booking.status) && booking.noShowAt === null;
