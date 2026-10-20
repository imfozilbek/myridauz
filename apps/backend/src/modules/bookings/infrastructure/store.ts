import type { Bindings } from '../../../env';
import type { BookingRepository } from '../application/ports';
import { d1Bookings } from './d1-bookings';
import { createMemoryBookings } from './memory-bookings';

// Without D1 (tests) bookings live in memory. One store for the module and trips: trips read the
// taken seats and "ayol bor" from it.
const localBookings = createMemoryBookings();
export const bookingStore = (env: Bindings): BookingRepository =>
  env.DB ? d1Bookings(env.DB) : localBookings;
