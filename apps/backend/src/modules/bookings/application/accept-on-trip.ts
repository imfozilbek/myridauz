import { onTheWay, type Offer } from '@platform/contracts';
import type { OfferRecord } from '../domain/offer';
import { acceptedWith, offerBooking, type AcceptError } from './accept-steps';
import type { BookingsDeps, Result } from './ports';
import type { RequestFacts } from './request-facts';

// The offer of a trip (G64): the booking goes on it. The seats are taken in one conditional write
// with the confirm (docs/65 A4); a trip opened for this request becomes an ordinary one.
export async function acceptOnTrip(
  deps: BookingsDeps,
  offer: OfferRecord,
  request: RequestFacts,
  tripId: string,
): Promise<Result<Offer, AcceptError>> {
  const [facts, [trip]] = await Promise.all([deps.trips.find(tripId), deps.trips.views([tripId])]);
  if (!facts?.live || !trip) return { ok: false, error: 'bookings.not_found' };
  if (onTheWay(facts, deps.now())) return { ok: false, error: 'bookings.departed' };
  const booking = await offerBooking(deps, offer, request, tripId, trip.pitak?.id ?? null);
  if (!(await deps.wallet.canAfford(offer.driverId, booking.commission)))
    return { ok: false, error: 'wallet.not_enough' };
  await deps.bookings.save({ ...booking, status: 'requested', confirmedAt: null });
  if (!(await deps.bookings.confirmWithin(booking, trip.seats))) {
    await deps.bookings.save({ ...booking, status: 'expired', confirmedAt: null });
    return { ok: false, error: 'bookings.no_seats' };
  }
  if ((await deps.wallet.charge(offer.driverId, booking.id, booking.commission)) !== 'ok') {
    await deps.bookings.save({ ...booking, status: 'expired' });
    return { ok: false, error: 'wallet.not_enough' };
  }
  if (trip.private) await deps.trips.release(tripId);
  return acceptedWith(deps, offer, request, booking);
}
