import { MINUTE_MS } from '@platform/contracts';
import type { Bindings } from '../../env';
import { TICK_MINUTES } from '../../shared/cron/tick';
import { bookingViews } from './application/views';
import { bookingsDeps } from './deps';
import { driverNewsOf } from './driver-news-of';
import { bookingStore } from './infrastructure/store';
import { passengerNewsOf } from './passenger-news-of';

// The live trip cards (G68, docs/122): the reminders and the trip events refresh them and ring under
// them; a request card is answered right in the driver bot.

// Confirmed bookings of these trips as their passengers see them: the reminders (G10).
export const confirmedBookings = async (env: Bindings, tripIds: readonly string[]) => {
  const deps = bookingsDeps(env);
  const confirmed = (await deps.bookings.byTrips(tripIds)).filter(
    (booking) => booking.status === 'confirmed',
  );
  return bookingViews(deps, confirmed, 'passenger');
};

export { passengerNewsOf };
export const tellDriver = (env: Bindings, tripId: string, ring?: 'soon' | 'askAgain', about?: string) =>
  driverNewsOf(env, bookingsDeps(env))(tripId, about, ring);
// The requests the driver did not answer in half of the time (G68, docs/122): those that passed the
// half within the last two ticks of the Cron, so a late tick misses none.
export const requestsPastHalf = (env: Bindings, now: number) =>
  bookingStore(env).waitingPastHalf(now, now - 2 * TICK_MINUTES * MINUTE_MS);
export { answerFromBot } from './bot-answer';
export { chatRing } from './chat-news';
export { ASK_PREFIX } from './infrastructure/ask-card';

// «Yoʻlga chiqdim»: every confirmed passenger hears it under the trip card (G68, mockup g68/1); the
// end of the trip only edits the cards: «Yetib keldingiz», off the top of the chat.
export async function tellTripPassengers(env: Bindings, tripId: string, ring?: 'departed'): Promise<void> {
  const news = passengerNewsOf(env);
  // A passenger the driver marked «Kelmadi» is not on this trip any more (G63).
  for (const booking of await confirmedBookings(env, [tripId]))
    if (booking.noShowAt === null) await news(booking, ring);
}
