import { tashkentDate, type DriverMonth } from '@platform/contracts';
import { holdsSeats } from '../domain/booking';
import type { BookingsDeps } from './ports';

// «Bu oy N safar» and «Yoʻl xarajati qaytdi» (G64, docs/118 path 7): the trips of this month in
// Tashkent that left, not cancelled, and the seats the passengers on them paid; a passenger who did
// not come paid nothing (docs/129).
export async function driverMonth(deps: BookingsDeps, driverId: number): Promise<DriverMonth> {
  const now = deps.now();
  const month = tashkentDate(now).slice(0, 7);
  const trips = (await deps.trips.views(await deps.trips.ofDriver(driverId))).filter(
    (trip) =>
      trip.status !== 'cancelled' &&
      tashkentDate(trip.departAt).startsWith(month) &&
      (trip.departedAt ?? trip.departAt) <= now,
  );
  const rode = (await deps.bookings.byTrips(trips.map((trip) => trip.id))).filter(
    (booking) => holdsSeats(booking.status) && booking.noShowAt === null,
  );
  const costs = rode.reduce((sum, booking) => sum + booking.price * booking.seats, 0);
  return { trips: trips.length, costs };
}
