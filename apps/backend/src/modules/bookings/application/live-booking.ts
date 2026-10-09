import type { Booking } from '@platform/contracts';
import type { BookingsDeps } from './ports';
import { bookingViews } from './views';

// The nearest booking of a passenger that still holds or waits for a seat, as the team sees it:
// the card of a support question shows it (G68, docs/122, mockup g68/4).
export async function liveBookingOf(deps: BookingsDeps, passengerId: number): Promise<Booking | undefined> {
  const views = await bookingViews(deps, await deps.bookings.byPassenger(passengerId), 'team');
  const live = views.filter(
    (booking) =>
      (booking.status === 'requested' || booking.status === 'confirmed') &&
      booking.noShowAt === null &&
      booking.trip.arrivedAt === null &&
      booking.trip.status !== 'completed' &&
      booking.trip.status !== 'cancelled',
  );
  return live.sort((a, b) => a.trip.departAt - b.trip.departAt)[0];
}
