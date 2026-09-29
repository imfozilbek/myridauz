import type { Booking } from '@platform/contracts';
import type { BookingRecord } from '../domain/booking';
import type { BookingsDeps, Result } from './ports';
import { bookingViews } from './views';

export type Progress = 'boarded' | 'arrived';

// "Mashinaga chiqdim" and "Yetib keldim" of the passenger (docs/43): only on a confirmed booking,
// once each; close people hear of it. "Yetib keldim" also means the passenger got in the car.
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
  const done = step === 'boarded' ? record.boardedAt !== null : record.arrivedAt !== null;
  const next: BookingRecord = done
    ? record
    : step === 'boarded'
      ? { ...record, boardedAt: now, updatedAt: now }
      : { ...record, boardedAt: record.boardedAt ?? now, arrivedAt: now, updatedAt: now };
  if (!done) await deps.bookings.save(next);
  const [view] = await bookingViews(deps, [next], 'passenger');
  if (!view) return { ok: false, error: 'bookings.not_found' };
  if (!done) await deps.notify.progress(view, step);
  return { ok: true, value: view };
}

// The booking as its passenger sees it, for sharing the trip with close people (docs/43).
export async function passengerView(deps: BookingsDeps, id: string): Promise<Booking | undefined> {
  const record = await deps.bookings.find(id);
  if (!record) return undefined;
  const [view] = await bookingViews(deps, [record], 'passenger');
  return view;
}
