import { onTheWay } from '@platform/contracts';
import { meetingBegun } from './meeting';
import { endDriverOffers } from './offers-ended';
import type { BookingsDeps } from './ports';
import { cancelByPassenger } from './request';
import { endSeatsOfTrip } from './trip-ended';

const OPEN = new Set(['requested', 'confirmed']);

// A blocked person (docs/17): every live trip of theirs is cancelled with its bookings, and every
// open booking, request and sent offer of theirs too (docs/65 A5). The passengers of the trips hear
// the team did it; the driver of a blocked passenger hears the seat is cancelled, never why;
// commissions go back. A trip already on the way, by the clock, «Yoʻlga chiqdim» or «Keldi» of
// the driver, goes on to its end (owner decision 10.10.2026, docs/17, G89 T4).
export async function cancelEverything(deps: BookingsDeps, userId: number): Promise<void> {
  for (const tripId of await deps.trips.ofDriver(userId)) {
    const trip = await deps.trips.find(tripId);
    if (!trip?.live || onTheWay(trip, deps.now()) || (await meetingBegun(deps, userId, tripId))) continue;
    if (await deps.trips.cancel(userId, tripId)) await endSeatsOfTrip(deps, userId, tripId, 'team');
  }
  for (const booking of await deps.bookings.byPassenger(userId)) {
    const trip = OPEN.has(booking.status) ? await deps.trips.find(booking.tripId) : undefined;
    if (trip?.live) await cancelByPassenger(deps, userId, booking.id, 'team');
  }
  for (const request of await deps.requests.ofPassenger(userId))
    if (request.open) await deps.requests.cancel(userId, request.id);
  await endDriverOffers(deps, userId);
}
