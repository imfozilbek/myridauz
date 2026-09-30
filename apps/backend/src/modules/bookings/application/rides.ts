import type { BookingRecord } from '../domain/booking';
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

const rode = (booking: BookingRecord) => booking.status === 'confirmed' || booking.status === 'completed';
export const chatKeyOf = (booking: BookingRecord) =>
  booking.offerId ? `o${booking.offerId}` : `b${booking.id}`;

export async function rideOf(deps: BookingsDeps, bookingId: string): Promise<Ride | undefined> {
  const booking = await deps.bookings.find(bookingId);
  if (!booking || !rode(booking)) return undefined;
  const trip = await deps.trips.find(booking.tripId);
  if (!trip) return undefined;
  const { driverId, departAt, endsAt, over } = trip;
  return {
    bookingId,
    tripId: trip.id,
    driverId,
    passengerId: booking.passengerId,
    departAt,
    endsAt,
    over,
    commission: booking.commission,
    chatKey: chatKeyOf(booking),
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
  return (await deps.bookings.byTrips([...byId.keys()])).filter(rode).flatMap((booking) => {
    const trip = byId.get(booking.tripId);
    if (!trip) return [];
    const { driverId, departAt, endsAt } = trip;
    const ride = { bookingId: booking.id, tripId: trip.id, driverId, passengerId: booking.passengerId };
    return [
      { ...ride, departAt, endsAt, over: true, commission: booking.commission, chatKey: chatKeyOf(booking) },
    ];
  });
}
