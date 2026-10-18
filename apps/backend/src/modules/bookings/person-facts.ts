import type { Bindings } from '../../env';
import { bookingsDeps } from './deps';
import { isRide } from './domain/meeting';

// What a person did with seats, for the team (docs/17, G45 «Odamlar»).
const deps = (env: Bindings) => bookingsDeps(env);

// The history of a passenger for a moderator: how many rides they took (docs/17), not the no-shows.
export const passengerRideCount = async (env: Bindings, passengerId: number) =>
  (await deps(env).bookings.byPassenger(passengerId)).filter(isRide).length;

// The newest seats of a passenger with the route and the day of their trip.
export async function ridesOfPerson(env: Bindings, passengerId: number, limit: number) {
  const { bookings, trips } = deps(env);
  const newest = (await bookings.byPassenger(passengerId))
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
  const rides = await Promise.all(
    newest.map(async (booking) => {
      const trip = await trips.find(booking.tripId);
      if (!trip) return [];
      const { id, tripId, status } = booking;
      return [{ id, tripId, from: trip.from, to: trip.to, departAt: trip.departAt, status }];
    }),
  );
  return rides.flat();
}

// Confirmed seats cancelled (docs/81 A07): as a passenger, and as a driver on own trips.
export async function cancelsOf(env: Bindings, userId: number) {
  const { bookings, trips } = deps(env);
  const confirmed = (status: string, booking: { status: string; confirmedAt: number | null }) =>
    booking.status === status && booking.confirmedAt !== null;
  const asPassenger = (await bookings.byPassenger(userId)).filter((b) =>
    confirmed('cancelled_by_passenger', b),
  );
  const onTrips = await bookings.byTrips(await trips.ofDriver(userId));
  const asDriver = onTrips.filter((b) => confirmed('cancelled_by_driver', b));
  return { asDriver: asDriver.length, asPassenger: asPassenger.length };
}
