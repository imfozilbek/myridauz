import type { Booking } from '@platform/contracts';
import type { Member } from '../../chat';
import type { BookingsDeps } from './ports';
import { bookingViews } from './views';

// Who may open a chat (docs/07): the passenger and the driver of the booking or of the offer.
// Anyone else, even the team, is not a member; the team reads a chat only on a complaint (G11).
export async function chatMember(deps: BookingsDeps, key: string, userId: number): Promise<Member | null> {
  const id = key.slice(1);
  const pair = key.startsWith('o') ? await offerPair(deps, id) : await bookingPair(deps, id);
  if (!pair) return null;
  const { canCall } = pair;
  if (userId === pair.passengerId) return { userId, role: 'passenger', otherId: pair.driverId, canCall };
  if (userId === pair.driverId) return { userId, role: 'driver', otherId: pair.passengerId, canCall };
  return null;
}

// canCall: a voice call opens only once the booking is confirmed (docs/08).
type Pair = { readonly passengerId: number; readonly driverId: number; readonly canCall: boolean };
const confirmed = async (deps: BookingsDeps, bookingId: string | null) =>
  bookingId !== null && (await deps.bookings.find(bookingId))?.status === 'confirmed';

async function bookingPair(deps: BookingsDeps, id: string): Promise<Pair | null> {
  const booking = await deps.bookings.find(id);
  const trip = booking ? await deps.trips.find(booking.tripId) : undefined;
  if (!booking || !trip) return null;
  return {
    passengerId: booking.passengerId,
    driverId: trip.driverId,
    canCall: booking.status === 'confirmed',
  };
}

async function offerPair(deps: BookingsDeps, id: string): Promise<Pair | null> {
  const offer = await deps.offers.find(id);
  const request = offer ? await deps.requests.find(offer.requestId) : undefined;
  if (!offer || !request) return null;
  const canCall = await confirmed(deps, offer.bookingId);
  return { passengerId: request.passengerId, driverId: offer.driverId, canCall };
}

// The booking of a chat as its member sees it (G54, docs/115): the call screen shows who and which
// trip. An offer chat has a booking only once the passenger took the offer; before, nothing.
export async function chatBooking(
  deps: BookingsDeps,
  key: string,
  userId: number,
): Promise<{ readonly booking: Booking; readonly role: Member['role'] } | null> {
  const member = await chatMember(deps, key, userId);
  if (!member) return null;
  const id = key.slice(1);
  const bookingId = key.startsWith('o') ? ((await deps.offers.find(id))?.bookingId ?? null) : id;
  const record = bookingId === null ? undefined : await deps.bookings.find(bookingId);
  if (!record) return null;
  const [view] = await bookingViews(deps, [record], member.role);
  return view ? { booking: view, role: member.role } : null;
}
