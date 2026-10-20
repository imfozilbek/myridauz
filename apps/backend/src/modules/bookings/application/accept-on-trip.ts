import { onTheWay, type Offer } from '@platform/contracts';
import type { OfferRecord } from '../domain/offer';
import { acceptedWith, offerBooking, walletShort, type AcceptError } from './accept-steps';
import { answer } from './answer';
import { chargeSeat } from './charge-seat';
import { declineCrowdedOut } from './crowded-out';
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
    return walletShort(deps, offer, booking);
  await deps.bookings.save({ ...booking, status: 'requested', confirmedAt: null });
  if (!(await deps.bookings.confirmWithin(booking, trip.seats))) {
    await deps.bookings.discard(booking.id);
    return { ok: false, error: 'bookings.no_seats' };
  }
  const charged = await chargeSeat(deps, offer.driverId, booking);
  if (charged === 'gone') return { ok: false, error: 'bookings.wrong_status' };
  if (charged === 'not_enough') {
    // The seat goes back and the row with it: the passenger never asked for it (G89 B18).
    await deps.bookings.save({ ...booking, status: 'requested', confirmedAt: null });
    await deps.bookings.discard(booking.id);
    return walletShort(deps, offer, booking);
  }
  if (trip.private) await deps.trips.release(tripId);
  const decline = (other: string) => answer(deps, offer.driverId, other, 'decline');
  await declineCrowdedOut(deps, tripId, trip.seats, decline);
  return acceptedWith(deps, offer, request, booking);
}
