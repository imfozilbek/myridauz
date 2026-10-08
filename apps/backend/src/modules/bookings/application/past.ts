import { showedUp } from '../domain/meeting';
import type { BookingsDeps, TripFacts } from './ports';

// A ride that is over: "Safarlar tarixi" of the profile (G18, docs/18).
export type PastRide = {
  readonly bookingId: string;
  readonly tripId: string;
  readonly driverId: number;
  readonly passengerId: number;
  readonly seats: number;
  readonly price: number;
  readonly from: string;
  readonly to: string;
  readonly departAt: number;
  readonly km: number;
};

// The rides of a passenger, or of the driver's trips, that are over; the newest first.
export async function pastRides(
  deps: BookingsDeps,
  userId: number,
  side: 'passenger' | 'driver',
): Promise<PastRide[]> {
  const bookings =
    side === 'passenger'
      ? await deps.bookings.byPassenger(userId)
      : await deps.bookings.byTrips(await deps.trips.ofDriver(userId));
  // A passenger who did not come rode nothing (docs/129, G63).
  const rode = bookings.filter(
    (booking) => (booking.status === 'confirmed' || booking.status === 'completed') && showedUp(booking),
  );
  const trips = new Map<string, Promise<TripFacts | undefined>>();
  const tripOf = (id: string) => trips.get(id) ?? trips.set(id, deps.trips.find(id)).get(id);
  const rides = await Promise.all(
    rode.map(async (booking) => {
      const trip = await tripOf(booking.tripId);
      if (!trip?.over) return null;
      const { driverId, from, to, departAt, km } = trip;
      const { id: bookingId, tripId, passengerId, seats, price } = booking;
      return { bookingId, tripId, driverId, passengerId, seats, price, from, to, departAt, km };
    }),
  );
  return rides.filter((ride) => ride !== null).sort((a, b) => b.departAt - a.departAt);
}
