import type { Booking, DriverMeetStep } from '@platform/contracts';
import { metOrMissed, type BookingRecord } from '../domain/booking';
import { mark, meetingOpen } from '../domain/meeting';
import { mine } from './answer';
import { withDriverExtras } from './driver-views';
import type { BookingsDeps, Result } from './ports';
import { bookingViews } from './views';

type MeetError =
  | 'bookings.not_found'
  | 'bookings.wrong_status'
  | 'bookings.not_meeting_time'
  | 'bookings.already_met'
  | 'bookings.already_no_show';

// The driver at each point of a confirmed booking (docs/126, G63), from MEET_BEFORE_MINUTES before
// the departure until the trip closes. «Men keldim» tells the passenger in the bot; «Keldi» and
// «Kelmadi» refresh the open screen of the passenger. «Kelmadi» files a no_show complaint of the
// driver: the team decides it and the owner confirms the refund (docs/35, docs/124 В).
export async function markMeeting(
  deps: BookingsDeps,
  driverId: number,
  id: string,
  step: DriverMeetStep,
): Promise<Result<Booking, MeetError>> {
  const found = await mine(deps, driverId, id);
  if (!found) return { ok: false, error: 'bookings.not_found' };
  const { record, facts } = found;
  if (record.status !== 'confirmed') return { ok: false, error: 'bookings.wrong_status' };
  const now = deps.now();
  if (!meetingOpen(facts, now)) return { ok: false, error: 'bookings.not_meeting_time' };
  const written = await write(deps, record, step, now);
  if (typeof written === 'string') return { ok: false, error: written };
  // Only the tap that wrote the mark tells the passenger and files the complaint (docs/65 A4).
  if (written.fresh) {
    await tellPassenger(deps, written.record, step);
    if (step === 'no_show') await deps.meeting.fileNoShow(driverId, id);
  }
  const [view] = await withDriverExtras(deps, driverId, await bookingViews(deps, [written.record], 'driver'));
  return view ? { ok: true, value: view } : { ok: false, error: 'bookings.not_found' };
}

type Written = { readonly record: BookingRecord; readonly fresh: boolean };
type MarkError = Exclude<MeetError, 'bookings.not_found' | 'bookings.not_meeting_time'>;

// The mark goes in one guarded step: of two taps at once, or a tap and a cancel, one wins. The other
// reads the booking again and answers by what is there now.
async function write(
  deps: BookingsDeps,
  record: BookingRecord,
  step: DriverMeetStep,
  now: number,
): Promise<Written | MarkError> {
  const next = mark(record, step, now);
  if (typeof next === 'string') return next;
  if (next === null) return { record, fresh: false };
  if (await deps.bookings.markOnce(record.id, step, now)) return { record: next, fresh: true };
  const current = await deps.bookings.find(record.id);
  if (current?.status !== 'confirmed') return 'bookings.wrong_status';
  const again = mark(current, step, now);
  if (again === null) return { record: current, fresh: false };
  return typeof again === 'string' ? again : 'bookings.wrong_status';
}

// The bot message refreshes the screen of the passenger by itself (docs/64).
async function tellPassenger(deps: BookingsDeps, record: BookingRecord, step: DriverMeetStep) {
  if (step === 'met') return deps.meeting.refreshPassenger(record.passengerId);
  const [view] = await bookingViews(deps, [record], 'passenger');
  if (!view) return;
  if (step === 'came') return deps.notify.driverCame(view);
  await deps.meeting.refreshPassenger(record.passengerId);
  await deps.notify.noShow(view);
}

// The driver marked «Keldi» or «Kelmadi» at a point of this trip: the ride has begun (G63).
export async function meetingBegun(deps: BookingsDeps, driverId: number, tripId: string): Promise<boolean> {
  const trip = await deps.trips.find(tripId);
  if (trip?.driverId !== driverId) return false;
  return (await deps.bookings.byTrips([tripId])).some(metOrMissed);
}
