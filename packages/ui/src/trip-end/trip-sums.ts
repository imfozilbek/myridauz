import type { Booking } from '@platform/contracts';
import { refundWaits } from '../meeting/no-show-text';

// A seat the driver took: confirmed before the end, completed after it (docs/35).
export const taken = (booking: Booking) => booking.status === 'confirmed' || booking.status === 'completed';

// Who rode: a passenger who did not come rode nothing (docs/129).
export const ridersOf = (bookings: readonly Booking[]) =>
  bookings.filter((booking) => taken(booking) && booking.noShowAt === null);

// The trip in numbers for its driver (mockups g63/4 screen 15, g63/5 phone 5): the people and their
// share of the costs; the commission charged for every seat taken, a no-show too, and what of it
// waits for the refund or came back (docs/12, docs/35).
export function tripSums(bookings: readonly Booking[]) {
  const riders = ridersOf(bookings);
  const sum = (list: readonly Booking[], value: (booking: Booking) => number) =>
    list.reduce((total, booking) => total + value(booking), 0);
  const refund = (booking: Booking) => booking.refund?.amount ?? booking.commission;
  return {
    passengers: sum(riders, (booking) => booking.seats),
    costs: sum(riders, (booking) => booking.price * booking.seats),
    charged: sum(bookings.filter(taken), (booking) => booking.commission),
    waits: sum(bookings.filter(refundWaits), refund),
    refunded: sum(
      bookings.filter((booking) => booking.refund?.state === 'confirmed'),
      refund,
    ),
  };
}
