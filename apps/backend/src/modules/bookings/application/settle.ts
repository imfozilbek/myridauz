import { DAY_MS } from '@platform/contracts';
import type { BookingsDeps } from './ports';
import { endSeatsOfTrip } from './trip-ended';

// Two days back: a broken cancel is found within the hour, the window covers missed Cron runs (G56).
const LOOKBACK_MS = 2 * DAY_MS;

// The hourly repair (G89 T2, M6): a cancel that broke halfway left a seat alive on a cancelled trip or
// kept a commission. Both end here: the seat as at the trip cancel, the money once (the wallet gives a
// commission back only once).
export async function settleBookings(deps: BookingsDeps): Promise<void> {
  const since = deps.now() - LOOKBACK_MS;
  for (const tripId of await deps.trips.cancelledAfter(since)) {
    const trip = await deps.trips.find(tripId);
    if (trip) await endSeatsOfTrip(deps, trip.driverId, tripId, 'driver');
  }
  for (const seat of await deps.bookings.cancelledSince(since)) {
    const trip = await deps.trips.find(seat.tripId);
    if (trip) await deps.wallet.refund(trip.driverId, seat.id);
  }
}
