import { withoutPoints, type BookingRecord } from '../domain/booking';
import { watchPairCancels } from './pair-cancels';
import type { BookingsDeps } from './ports';
import { bookingViews } from './views';

const OPEN = new Set(['requested', 'confirmed']);
export type CancelledBy = 'driver' | 'team';

// A cancelled trip ends every seat on it (docs/35, G89 T2, T5): the request and the confirmed seat
// alike, the commission back, and the passenger hears who cancelled the trip: the driver, or the
// team (its own cancel or the block of the driver, docs/17), never "did not confirm".
export async function endSeatsOfTrip(deps: BookingsDeps, driverId: number, tripId: string, by: CancelledBy) {
  for (const record of await deps.bookings.byTrips([tripId]))
    if (OPEN.has(record.status)) await endSeat(deps, driverId, record, by);
}

async function endSeat(deps: BookingsDeps, driverId: number, record: BookingRecord, by: CancelledBy) {
  const next = withoutPoints({ ...record, status: 'cancelled_by_driver', updatedAt: deps.now() });
  if (!(await deps.bookings.replace(next, record.status))) return;
  if (record.status === 'confirmed') {
    await deps.wallet.refund(driverId, record.id);
    if (by === 'driver') await watchPairCancels(deps, driverId, record.passengerId);
  }
  const [view] = await bookingViews(deps, [next], 'passenger');
  if (view) await deps.notify.cancelled(view, by);
}
