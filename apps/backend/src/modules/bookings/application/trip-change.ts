import type { BookingsDeps } from './ports';
import { bookingViews } from './views';

const OPEN = new Set(['requested', 'confirmed']);

// The driver moved the time (G39, docs/104): every passenger with an open booking hears it from the
// bot. A lower price is never told to them: a booking keeps its own price (owner decisions 04.10.2026).
export async function tellTripRetimed(deps: BookingsDeps, tripId: string): Promise<void> {
  const open = (await deps.bookings.byTrips([tripId])).filter((booking) => OPEN.has(booking.status));
  for (const booking of await bookingViews(deps, open, 'passenger')) await deps.notify.tripRetimed(booking);
}
