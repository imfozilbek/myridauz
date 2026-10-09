import { arrivalAt, type Booking } from '@platform/contracts';
import type { Member } from '../../chat';
import { statusAt } from '../domain/booking';
import type { BookingsDeps } from './ports';
import { bookingViews } from './views';

// Who may open a chat (docs/07): the passenger and the driver of the booking, of the offer or of the
// talk about a request (G64). Anyone else, even the team, is not a member; the team reads a chat
// only on a complaint (G11).
export async function chatMember(deps: BookingsDeps, key: string, userId: number): Promise<Member | null> {
  const pair = await pairOf(deps, key);
  if (!pair) return null;
  const { canCall, canWrite, callsOff, ringLimit } = pair;
  if (userId === pair.passengerId)
    return {
      userId,
      role: 'passenger',
      otherId: pair.driverId,
      canCall,
      canWrite,
      callsOff: false,
      ringLimit: null,
    };
  if (userId === pair.driverId)
    return { userId, role: 'driver', otherId: pair.passengerId, canCall, canWrite, callsOff, ringLimit };
  return null;
}

// canCall: a voice call opens once the booking is confirmed (docs/08) and stays 24 hours after the
// arrival, like writing; then the chat is read only (docs/129). A talk about an open request calls
// before a booking too, the driver within the limit and while the passenger allows it (G64).
type Talk = { readonly canCall: boolean; readonly canWrite: boolean };
type Pair = Talk & {
  readonly passengerId: number;
  readonly driverId: number;
  readonly callsOff: boolean;
  readonly ringLimit: number | null;
};
const HOUR_MS = 60 * 60 * 1000;
const BOOKED = { callsOff: false, ringLimit: null } as const;

async function talkOf(deps: BookingsDeps, bookingId: string | null): Promise<Talk> {
  const booking = bookingId === null ? undefined : await deps.bookings.find(bookingId);
  const trip = booking ? await deps.trips.find(booking.tripId) : undefined;
  if (!booking || !trip) return { canCall: false, canWrite: true };
  const now = deps.now();
  const status = statusAt(booking, now, trip.over);
  // The day of writing counts from «Yetib keldik» when the car came, as on the screens (afterTrip).
  const talkMs = deps.limits.chat.afterTripHours * HOUR_MS;
  const after = now < (trip.arrivedAt ?? arrivalAt(trip.departAt, trip.km)) + talkMs;
  if (status === 'completed') return { canCall: after, canWrite: after };
  return { canCall: status === 'confirmed', canWrite: true };
}

const pairOf = (deps: BookingsDeps, key: string): Promise<Pair | null> => {
  const id = key.slice(1);
  if (key.startsWith('t')) return talkPair(deps, id);
  return key.startsWith('o') ? offerPair(deps, id) : bookingPair(deps, id);
};

async function bookingPair(deps: BookingsDeps, id: string): Promise<Pair | null> {
  const booking = await deps.bookings.find(id);
  const trip = booking ? await deps.trips.find(booking.tripId) : undefined;
  if (!booking || !trip) return null;
  return {
    passengerId: booking.passengerId,
    driverId: trip.driverId,
    ...BOOKED,
    ...(await talkOf(deps, id)),
  };
}

async function offerPair(deps: BookingsDeps, id: string): Promise<Pair | null> {
  const offer = await deps.offers.find(id);
  const request = offer ? await deps.requests.find(offer.requestId) : undefined;
  if (!offer || !request) return null;
  const talk = await talkOf(deps, offer.bookingId);
  return { passengerId: request.passengerId, driverId: offer.driverId, ...BOOKED, ...talk };
}

// The booking a talk became: the accepted offer of this driver on the request (G64).
async function talkBookingId(deps: BookingsDeps, talkId: string, requestId: string) {
  const offers = await deps.offers.byRequests([requestId]);
  return offers.find((offer) => offer.talkId === talkId && offer.bookingId !== null)?.bookingId ?? null;
}

async function talkPair(deps: BookingsDeps, id: string): Promise<Pair | null> {
  const talk = await deps.talks.find(id);
  const request = talk ? await deps.requests.find(talk.requestId) : undefined;
  if (!talk || !request) return null;
  const people = { passengerId: request.passengerId, driverId: talk.driverId };
  const bookingId = await talkBookingId(deps, id, talk.requestId);
  if (bookingId !== null) return { ...people, ...BOOKED, ...(await talkOf(deps, bookingId)) };
  const before = { callsOff: request.callsOff, ringLimit: deps.limits.calls.requestRings };
  return { ...people, ...before, canCall: request.open, canWrite: true };
}

// The booking of a chat as its member sees it (G54, docs/115): the call screen shows who and which
// trip. An offer or a talk has a booking only once the passenger took the offer; before, nothing.
export async function chatBooking(
  deps: BookingsDeps,
  key: string,
  userId: number,
): Promise<{ readonly booking: Booking; readonly role: Member['role'] } | null> {
  const member = await chatMember(deps, key, userId);
  if (!member) return null;
  const record = await chatBookingRecord(deps, key);
  if (!record) return null;
  const [view] = await bookingViews(deps, [record], member.role);
  return view ? { booking: view, role: member.role } : null;
}

async function chatBookingRecord(deps: BookingsDeps, key: string) {
  const id = key.slice(1);
  if (key.startsWith('b')) return deps.bookings.find(id);
  const talk = key.startsWith('t') ? await deps.talks.find(id) : undefined;
  const bookingId = talk
    ? await talkBookingId(deps, id, talk.requestId)
    : ((await deps.offers.find(id))?.bookingId ?? null);
  return bookingId === null ? undefined : deps.bookings.find(bookingId);
}
