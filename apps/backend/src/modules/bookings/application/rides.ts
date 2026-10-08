import { holdsSeats, type BookingRecord } from '../domain/booking';
import { isRide } from '../domain/meeting';
import { bookingChatKey } from '../domain/talk';
import type { BookingsDeps } from './ports';

// A ride: a confirmed booking of a trip. Ratings and complaints are about rides (docs/17, docs/24).
export type Ride = {
  readonly bookingId: string;
  readonly tripId: string;
  readonly driverId: number;
  readonly passengerId: number;
  readonly departAt: number;
  readonly endsAt: number;
  readonly over: boolean;
  // The commission of the booking: given back by hand on a no-show (docs/35).
  readonly commission: number;
  // The chat of the booking, or of the offer it came from (docs/07).
  readonly chatKey: string;
};

export async function rideOf(deps: BookingsDeps, bookingId: string): Promise<Ride | undefined> {
  const booking = await deps.bookings.find(bookingId);
  return booking && holdsSeats(booking.status) ? asRide(deps, booking) : undefined;
}

// A ride to rate: a passenger who did not come is not rated and rates nothing (docs/129, G63).
export async function ratableRideOf(deps: BookingsDeps, bookingId: string): Promise<Ride | undefined> {
  const booking = await deps.bookings.find(bookingId);
  return booking && isRide(booking) ? asRide(deps, booking) : undefined;
}

// The ride of a filed complaint stays after a later cancel: the team still decides it (docs/65 A5).
export async function filedRideOf(deps: BookingsDeps, bookingId: string): Promise<Ride | undefined> {
  const booking = await deps.bookings.find(bookingId);
  if (!booking) return undefined;
  const ride = await asRide(deps, booking);
  // A cancel already gave the commission back: a no-show decision gives nothing more (docs/35).
  return ride && { ...ride, commission: holdsSeats(booking.status) ? ride.commission : 0 };
}

async function asRide(deps: BookingsDeps, booking: BookingRecord): Promise<Ride | undefined> {
  const trip = await deps.trips.find(booking.tripId);
  if (!trip) return undefined;
  const { driverId, departAt, endsAt, over, arrivedAt } = trip;
  return {
    bookingId: booking.id,
    tripId: trip.id,
    driverId,
    passengerId: booking.passengerId,
    departAt,
    endsAt,
    // «Yetib keldik» ends the ride at once: the stars come right after it (docs/129, docs/124 В).
    over: over || arrivedAt !== null,
    commission: booking.commission,
    chatKey: bookingChatKey(booking),
  };
}

// The rides of trips that ended: the Cron job of the ratings asks both sides (docs/24).
type EndedTrip = {
  readonly id: string;
  readonly driverId: number;
  readonly departAt: number;
  readonly endsAt: number;
};
export async function ridesOf(deps: BookingsDeps, trips: readonly EndedTrip[]): Promise<Ride[]> {
  const byId = new Map(trips.map((trip) => [trip.id, trip]));
  // A passenger who did not come rode nothing: no rating asks (docs/129, G63).
  const booked = await deps.bookings.byTrips([...byId.keys()]);
  return booked.filter(isRide).flatMap((booking) => {
    const trip = byId.get(booking.tripId);
    if (!trip) return [];
    const { driverId, departAt, endsAt } = trip;
    const ride = { bookingId: booking.id, tripId: trip.id, driverId, passengerId: booking.passengerId };
    return [
      {
        ...ride,
        departAt,
        endsAt,
        over: true,
        commission: booking.commission,
        chatKey: bookingChatKey(booking),
      },
    ];
  });
}
