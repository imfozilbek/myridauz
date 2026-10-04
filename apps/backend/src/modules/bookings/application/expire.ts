import type { BookingsDeps } from './ports';
import { bookingViews } from './views';

// A request the driver did not answer in time ends; the passenger hears it and looks for another
// trip, nobody is left waiting (docs/35, docs/83 N03). A message that did not go out puts its
// request back: the next run of the Cron expires it again and tells it (G42, docs/111).
export async function expireRequests(deps: BookingsDeps, now: number): Promise<void> {
  for (const record of await deps.bookings.expireOver(now)) {
    try {
      for (const booking of await bookingViews(deps, [record], 'passenger'))
        await deps.notify.expired(booking);
      deps.track('expired');
    } catch (error) {
      console.error(JSON.stringify({ event: 'expire_untold', booking: record.id, message: String(error) }));
      await deps.bookings.replace({ ...record, status: 'requested' }, 'expired');
    }
  }
}
