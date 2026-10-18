import { DAY_MS } from '@platform/contracts';
import type { BookingsDeps } from './ports';

// The confirmed seats of one pair cancelled in a month that make a sign (G45, docs/81 A07, N26).
const PAIR_CANCELS = 3;
const WINDOW_DAYS = 30;
const CANCELLED: ReadonlySet<string> = new Set(['cancelled_by_passenger', 'cancelled_by_driver']);

// A driver and a passenger who confirm a seat and cancel it again and again: the commission comes back
// each time, maybe they ride past Rida. The owner hears it in «Diqqat» (docs/83 N26).
export async function watchPairCancels(deps: BookingsDeps, driverId: number, passengerId: number) {
  const since = deps.now() - WINDOW_DAYS * DAY_MS;
  const cancelled = (await deps.bookings.byPassenger(passengerId)).filter(
    (booking) =>
      CANCELLED.has(booking.status) && booking.confirmedAt !== null && booking.confirmedAt >= since,
  );
  const trips = await Promise.all(cancelled.map((booking) => deps.trips.find(booking.tripId)));
  const count = trips.filter((trip) => trip?.driverId === driverId).length;
  if (count >= PAIR_CANCELS) await deps.pairCancelled(driverId, passengerId, count);
}
