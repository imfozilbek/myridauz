import type { BookingStatus } from '@platform/contracts';
import type { Bindings } from '../../env';
import type { ChatNews } from '../chat';
import { bookingViews } from './application/views';
import { bookingsDeps } from './deps';
import { bookingChatKey } from './domain/talk';
import { driverNewsOf } from './driver-news-of';
import { passengerNewsOf } from './passenger-news-of';

// A seat keeps its trip card from the request until the trip is over (G68, docs/122).
const CARDED: ReadonlySet<BookingStatus> = new Set(['requested', 'confirmed', 'completed']);

// A message or a call in the chat of a seat rings under the trip card of the person it waits for
// (docs/122 rule 5); the passenger card counts the unread messages. False: the chat has no seat
// (a talk about a request), the chat tells as before.
export async function chatRing(env: Bindings, { to, key, kind }: ChatNews): Promise<boolean> {
  const deps = bookingsDeps(env);
  const passengerId = to.role === 'passenger' ? to.userId : to.from;
  const seat = (await deps.bookings.byPassenger(passengerId)).find(
    (booking) => CARDED.has(booking.status) && bookingChatKey(booking) === key,
  );
  if (!seat) return false;
  const ring = kind === 'read' ? undefined : kind;
  if (to.role === 'driver') {
    // The driver card counts no messages: a read changes nothing there.
    if (ring) await driverNewsOf(env, deps)(seat.tripId, seat.id, ring);
    return true;
  }
  const [view] = await bookingViews(deps, [seat], 'passenger');
  if (view) await passengerNewsOf(env)(view, ring);
  return true;
}
