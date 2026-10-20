import { statusAt } from '../domain/booking';
import type { BookingsDeps } from './ports';

// The car filled up (G89 B3): a request the free seats no longer take hears «no» at once, so the
// passenger books another trip instead of waiting a day for an answer that cannot be «yes».
export async function declineCrowdedOut(
  deps: BookingsDeps,
  tripId: string,
  seats: number,
  decline: (id: string) => Promise<unknown>,
): Promise<void> {
  const now = deps.now();
  const bookings = await deps.bookings.byTrips([tripId]);
  const taken = bookings.filter((b) => b.status === 'confirmed').reduce((sum, b) => sum + b.seats, 0);
  for (const booking of bookings)
    if (statusAt(booking, now, false) === 'requested' && booking.seats > seats - taken)
      await decline(booking.id);
}
