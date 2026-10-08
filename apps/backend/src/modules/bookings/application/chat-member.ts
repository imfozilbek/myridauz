import { AFTER_TRIP_TALK_HOURS, arrivalAt, type Booking } from '@platform/contracts';
import type { Member } from '../../chat';
import { statusAt } from '../domain/booking';
import type { BookingsDeps } from './ports';
import { bookingViews } from './views';

// Who may open a chat (docs/07): the passenger and the driver of the booking or of the offer.
// Anyone else, even the team, is not a member; the team reads a chat only on a complaint (G11).
export async function chatMember(deps: BookingsDeps, key: string, userId: number): Promise<Member | null> {
  const id = key.slice(1);
  const pair = key.startsWith('o') ? await offerPair(deps, id) : await bookingPair(deps, id);
  if (!pair) return null;
  const { canCall, canWrite } = pair;
  if (userId === pair.passengerId)
    return { userId, role: 'passenger', otherId: pair.driverId, canCall, canWrite };
  if (userId === pair.driverId)
    return { userId, role: 'driver', otherId: pair.passengerId, canCall, canWrite };
  return null;
}

// canCall: a voice call opens once the booking is confirmed (docs/08) and stays 24 hours after the
// arrival, like writing; then the chat is read only (docs/129).
type Talk = { readonly canCall: boolean; readonly canWrite: boolean };
type Pair = Talk & { readonly passengerId: number; readonly driverId: number };
const HOUR_MS = 60 * 60 * 1000;

async function talkOf(deps: BookingsDeps, bookingId: string | null): Promise<Talk> {
  const booking = bookingId === null ? undefined : await deps.bookings.find(bookingId);
  const trip = booking ? await deps.trips.find(booking.tripId) : undefined;
  if (!booking || !trip) return { canCall: false, canWrite: true };
  const now = deps.now();
  const status = statusAt(booking, now, trip.over);
  // The day of writing counts from «Yetib keldik» when the car came, as on the screens (afterTrip).
  const after = now < (trip.arrivedAt ?? arrivalAt(trip.departAt, trip.km)) + AFTER_TRIP_TALK_HOURS * HOUR_MS;
  if (status === 'completed') return { canCall: after, canWrite: after };
  return { canCall: status === 'confirmed', canWrite: true };
}

async function bookingPair(deps: BookingsDeps, id: string): Promise<Pair | null> {
  const booking = await deps.bookings.find(id);
  const trip = booking ? await deps.trips.find(booking.tripId) : undefined;
  if (!booking || !trip) return null;
  return { passengerId: booking.passengerId, driverId: trip.driverId, ...(await talkOf(deps, id)) };
}

async function offerPair(deps: BookingsDeps, id: string): Promise<Pair | null> {
  const offer = await deps.offers.find(id);
  const request = offer ? await deps.requests.find(offer.requestId) : undefined;
  if (!offer || !request) return null;
  return {
    passengerId: request.passengerId,
    driverId: offer.driverId,
    ...(await talkOf(deps, offer.bookingId)),
  };
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
