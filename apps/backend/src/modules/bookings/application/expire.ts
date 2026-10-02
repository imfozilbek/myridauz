import type { BookingsDeps } from './ports';
import { bookingViews } from './views';

// A request the driver did not answer in time ends; the passenger hears it and looks for another
// trip, nobody is left waiting (docs/35, docs/83 N03).
export async function expireRequests(deps: BookingsDeps, now: number): Promise<void> {
  const expired = await deps.bookings.expireOver(now);
  expired.forEach(() => deps.track('expired'));
  for (const booking of await bookingViews(deps, expired, 'passenger')) await deps.notify.expired(booking);
}
