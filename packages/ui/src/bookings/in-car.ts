import { inCarAt, type Booking } from '@platform/contracts';

// The passenger is in the car (docs/43): the rule of the server, on the booking of the screen.
export const inCar = (booking: Booking, now: number, meetMinutes: number) =>
  inCarAt(booking, booking.trip, now, meetMinutes);
