import type { Member } from '../../chat';
import type { BookingsDeps } from './ports';

// Who may open a chat (docs/07): the passenger and the driver of the booking or of the offer.
// Anyone else, even the team, is not a member; the team reads a chat only on a complaint (G11).
export async function chatMember(deps: BookingsDeps, key: string, userId: number): Promise<Member | null> {
  const id = key.slice(1);
  const pair = key.startsWith('o') ? await offerPair(deps, id) : await bookingPair(deps, id);
  if (!pair) return null;
  if (userId === pair.passengerId) return { userId, role: 'passenger', otherId: pair.driverId };
  if (userId === pair.driverId) return { userId, role: 'driver', otherId: pair.passengerId };
  return null;
}

type Pair = { readonly passengerId: number; readonly driverId: number };

async function bookingPair(deps: BookingsDeps, id: string): Promise<Pair | null> {
  const booking = await deps.bookings.find(id);
  const trip = booking ? await deps.trips.find(booking.tripId) : undefined;
  return booking && trip ? { passengerId: booking.passengerId, driverId: trip.driverId } : null;
}

async function offerPair(deps: BookingsDeps, id: string): Promise<Pair | null> {
  const offer = await deps.offers.find(id);
  const request = offer ? await deps.requests.find(offer.requestId) : undefined;
  return offer && request ? { passengerId: request.passengerId, driverId: offer.driverId } : null;
}
