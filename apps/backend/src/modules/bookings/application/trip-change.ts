import { answerDeadline } from '../domain/answer-deadline';
import type { BookingRecord } from '../domain/booking';
import type { BookingsDeps } from './ports';
import { bookingViews } from './views';

const OPEN = new Set(['requested', 'confirmed']);

// The driver moved the time (G39, docs/104): every passenger with an open booking hears it from the
// bot. A lower price is never told to them: a booking keeps its own price (owner decisions 04.10.2026).
export async function tellTripRetimed(deps: BookingsDeps, tripId: string): Promise<void> {
  const open = (await deps.bookings.byTrips([tripId])).filter((booking) => OPEN.has(booking.status));
  const trip = await deps.trips.find(tripId);
  if (trip) await moveWaiting(deps, open, trip);
  const fresh = await Promise.all(
    open.map(async (booking) => (await deps.bookings.find(booking.id)) ?? booking),
  );
  for (const booking of await bookingViews(deps, fresh, 'passenger')) await deps.notify.tripRetimed(booking);
}

// What waits for an answer moves with the trip (G89 T13, B14): a request keeps the deadline it would
// have had at the new time, an offer to the trip shows and keeps the new time.
async function moveWaiting(
  deps: BookingsDeps,
  open: readonly BookingRecord[],
  trip: Parameters<typeof answerDeadline>[0] & { readonly id: string; readonly driverId: number },
) {
  const hours = deps.limits.bookings.answerHours;
  for (const booking of open) {
    const expiresAt = answerDeadline(trip, booking.createdAt, hours);
    if (booking.status === 'requested' && expiresAt > booking.expiresAt)
      await deps.bookings.replace({ ...booking, expiresAt }, 'requested');
  }
  for (const offer of await deps.offers.byDriver(trip.driverId))
    if (offer.tripId === trip.id && offer.status === 'sent' && offer.departAt !== trip.departAt)
      if (await deps.offers.replace({ ...offer, departAt: trip.departAt }, 'sent'))
        await deps.notify.requestChanged(offer.requestId);
}
