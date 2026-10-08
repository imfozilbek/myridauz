import type { Booking, DriverMeetStep } from '@platform/contracts';
import type { BookingRecord } from '../domain/booking';
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
  const next = mark(record, step, now);
  if (typeof next === 'string') return { ok: false, error: next };
  if (next) {
    await deps.bookings.save(next);
    await tellPassenger(deps, next, step);
    if (step === 'no_show') await deps.meeting.fileNoShow(driverId, id);
  }
  const [view] = await withDriverExtras(deps, driverId, await bookingViews(deps, [next ?? record], 'driver'));
  return view ? { ok: true, value: view } : { ok: false, error: 'bookings.not_found' };
}

// The bot message refreshes the screen of the passenger by itself (docs/64).
async function tellPassenger(deps: BookingsDeps, record: BookingRecord, step: DriverMeetStep) {
  if (step !== 'came') return deps.meeting.refreshPassenger(record.passengerId);
  const [view] = await bookingViews(deps, [record], 'passenger');
  if (view) await deps.notify.driverCame(view);
}
