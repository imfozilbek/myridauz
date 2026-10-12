import type { Bindings } from '../../env';
import { heldSeat } from './application/held-seat';
import { endNewTripOffers } from './application/offers-ended';
import { bookingsDeps } from './deps';

// One at a time (owner decision 12.10.2026, docs/172) for the other modules: a driver has one live
// trip, a passenger an open request or a seat.

// A new trip of a driver: the offers waiting without a trip are over.
export async function endOffersOfNewTrip(env: Bindings, tripId: string): Promise<void> {
  const deps = bookingsDeps(env);
  const trip = await deps.trips.find(tripId);
  if (trip) await endNewTripOffers(deps, trip.driverId);
}

// A passenger with a seat leaves no request.
export async function heldSeatOf(env: Bindings, passengerId: number): Promise<boolean> {
  const deps = bookingsDeps(env);
  return (await heldSeat(deps, await deps.bookings.byPassenger(passengerId), deps.now())) !== null;
}
