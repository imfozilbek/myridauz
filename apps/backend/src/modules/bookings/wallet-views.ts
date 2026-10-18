import type { Bindings } from '../../env';
import { bookingViews } from './application/views';
import { bookingsDeps } from './deps';

// «Hamyon» names the passenger and the seats of each booking of its rows (G63, G65).
export const walletBookingsOf = async (env: Bindings, bookingIds: readonly string[]) => {
  const deps = bookingsDeps(env);
  const named = await Promise.all(
    bookingIds.map(async (id) => {
      const booking = await deps.bookings.find(id);
      const person = booking && (await deps.people.find(booking.passengerId));
      return person ? [[id, { passenger: person.firstName, seats: booking.seats }] as const] : [];
    }),
  );
  return new Map(named.flat());
};

// The details of a commission show the booking as its driver sees it (G65, mockup g65/2).
export const driverBookingOf = async (env: Bindings, bookingId: string) => {
  const deps = bookingsDeps(env);
  const record = await deps.bookings.find(bookingId);
  return record ? (await bookingViews(deps, [record], 'driver'))[0] : undefined;
};
