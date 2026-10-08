import type { Booking } from '@platform/contracts';
import type { BookingsDeps } from './ports';

// What only the driver sees of the bookings (G63): whether the passenger is rated already
// (docs/129) and the refund of the commission of a no-show (docs/35).
export async function withDriverExtras(
  deps: BookingsDeps,
  driverId: number,
  views: readonly Booking[],
): Promise<Booking[]> {
  const ids = views.map((view) => view.id);
  const [rated, refunds] = await Promise.all([deps.rated(driverId), deps.meeting.refunds(driverId, ids)]);
  return views.map((view) => {
    const state = refunds.get(view.id);
    return { ...view, rated: rated.has(view.id), refund: state ? { state, amount: view.commission } : null };
  });
}
