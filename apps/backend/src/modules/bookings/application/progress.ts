import { inCarAt, meetingStartsAt, type Booking } from '@platform/contracts';
import type { BookingsDeps, Result } from './ports';
import { bookingViews } from './views';

export type Progress = 'came' | 'arrived';

// "Men keldim" at the meeting point tells the driver (docs/126), from the brand's minutes before the
// departure until the passenger is in the car.
// "Yetib keldim" of the passenger (docs/43): only on a confirmed booking, once; close people hear of
// it. It also means the passenger got in the car: the driver's «Keldi» says so first (G76).
export async function markProgress(
  deps: BookingsDeps,
  passengerId: number,
  id: string,
  step: Progress,
): Promise<Result<Booking, 'bookings.not_found' | 'bookings.wrong_status'>> {
  const record = await deps.bookings.find(id);
  if (record?.passengerId !== passengerId) return { ok: false, error: 'bookings.not_found' };
  if (record.status !== 'confirmed') return { ok: false, error: 'bookings.wrong_status' };
  const now = deps.now();
  const trip = await deps.trips.find(record.tripId);
  if (!trip) return { ok: false, error: 'bookings.not_found' };
  const { meetMinutes } = deps.limits.schedule;
  // «Men keldim» from the meeting until the car; «Yetib keldim» only from the car (G89 B1).
  const allowed =
    step === 'came'
      ? record.boardedAt === null && now >= meetingStartsAt(trip.departAt, meetMinutes)
      : inCarAt(record, trip, now, meetMinutes);
  if (!allowed) return { ok: false, error: 'bookings.wrong_status' };
  // One guarded write: a second tap, or a cancel of the driver that came first, writes nothing.
  const fresh = await deps.bookings.markStep(id, step, now);
  const next = await deps.bookings.find(id);
  if (next?.status !== 'confirmed') return { ok: false, error: 'bookings.wrong_status' };
  const [view] = await bookingViews(deps, [next], 'passenger');
  if (!view) return { ok: false, error: 'bookings.not_found' };
  if (fresh) await (step === 'came' ? deps.notify.came(view) : deps.notify.progress(view, step));
  return { ok: true, value: view };
}

// The booking as its passenger sees it, for sharing the trip with close people (docs/43).
export async function passengerView(deps: BookingsDeps, id: string) {
  const record = await deps.bookings.find(id);
  if (!record) return undefined;
  const [view] = await bookingViews(deps, [record], 'passenger');
  // The view carries the public id only: the owner check needs the Telegram ID (docs/65 A3).
  return view && { view, passengerId: record.passengerId };
}
