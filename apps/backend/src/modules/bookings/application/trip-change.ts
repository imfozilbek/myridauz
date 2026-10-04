import type { BookingsDeps } from './ports';
import { bookingViews } from './views';

const OPEN = new Set(['requested', 'confirmed']);

// The driver moved the time or lowered the price (G39, docs/104): every passenger with an open
// booking hears it from the bot. A booking keeps its own price and commission (owner decision 04.10.2026).
export async function tellTripChange(
  deps: BookingsDeps,
  tripId: string,
  change: 'retimed' | 'cheaper',
): Promise<void> {
  const open = (await deps.bookings.byTrips([tripId])).filter((booking) => OPEN.has(booking.status));
  for (const booking of await bookingViews(deps, open, 'passenger'))
    await deps.notify.tripChanged(booking, change);
}
