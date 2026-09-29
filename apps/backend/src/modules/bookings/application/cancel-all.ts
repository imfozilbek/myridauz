import { answer } from './answer';
import type { BookingsDeps } from './ports';
import { cancelByPassenger } from './request';

const OPEN = new Set(['requested', 'confirmed']);

// A blocked person (docs/17): every live trip of theirs is cancelled with its bookings, and every
// open booking of theirs too. The other sides hear it from the usual bot messages; commissions go back.
export async function cancelEverything(deps: BookingsDeps, userId: number): Promise<void> {
  for (const tripId of await deps.trips.ofDriver(userId)) {
    const trip = await deps.trips.find(tripId);
    if (!trip?.live) continue;
    for (const booking of await deps.bookings.byTrips([tripId]))
      if (OPEN.has(booking.status)) await answer(deps, userId, booking.id, 'driver_cancel');
    await deps.trips.cancel(userId, tripId);
  }
  for (const booking of await deps.bookings.byPassenger(userId)) {
    const trip = OPEN.has(booking.status) ? await deps.trips.find(booking.tripId) : undefined;
    if (trip?.live) await cancelByPassenger(deps, userId, booking.id);
  }
}
