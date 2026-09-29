import type { Bindings } from '../../../env';
import type { BookingRepository } from '../application/ports';
import { d1Bookings } from './d1-bookings';
import { createMemoryBookings } from './memory-bookings';

// Without D1 (tests) bookings live in memory. One store for the module, trips and photos:
// trips read the taken seats and "ayol bor" from it, photos read who rides together.
const localBookings = createMemoryBookings();
export const bookingStore = (env: Bindings): BookingRepository =>
  env.DB ? d1Bookings(env.DB) : localBookings;

// Photos (docs/05): two passengers with confirmed bookings on the same trip see each other.
export async function rideTogether(store: BookingRepository, a: number, b: number): Promise<boolean> {
  const confirmedTrips = async (passengerId: number) =>
    (await store.byPassenger(passengerId))
      .filter((booking) => booking.status === 'confirmed')
      .map((booking) => booking.tripId);
  const [mine, theirs] = await Promise.all([confirmedTrips(a), confirmedTrips(b)]);
  return mine.some((tripId) => theirs.includes(tripId));
}
