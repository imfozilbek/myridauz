import { withoutPoints, type BookingRecord } from '../domain/booking';
import type { BookingsDeps } from './ports';
import { bookingViews } from './views';

// The passenger hears that the request ended and looks for another trip. A message that did not go
// out puts its request back: the next run of the Cron expires it again and tells it (G42, docs/111).
async function tell(deps: BookingsDeps, record: BookingRecord): Promise<void> {
  try {
    for (const booking of await bookingViews(deps, [record], 'passenger')) await deps.notify.expired(booking);
    deps.track('expired');
  } catch (error) {
    console.error(JSON.stringify({ event: 'expire_untold', booking: record.id, message: String(error) }));
    await deps.bookings.replace({ ...record, status: 'requested' }, 'expired');
  }
}

// A request the driver did not answer in time ends; nobody is left waiting (docs/35, docs/83 N03).
export async function expireRequests(deps: BookingsDeps, now: number): Promise<void> {
  for (const record of await deps.bookings.expireOver(now)) await tell(deps, record);
}

// «Yoʻlga chiqdim» before the time (G63): the requests of the trip wait no more, an answer never
// comes after the departure (docs/35). One conditional write each, like the Cron.
export async function expireTripRequests(deps: BookingsDeps, tripId: string): Promise<void> {
  const now = deps.now();
  for (const record of await deps.bookings.byTrips([tripId])) {
    if (record.status !== 'requested') continue;
    const expired = withoutPoints({ ...record, status: 'expired', updatedAt: now });
    if (await deps.bookings.replace(expired, 'requested')) await tell(deps, expired);
  }
}
