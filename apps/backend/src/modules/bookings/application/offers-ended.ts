import type { OfferRecord } from '../domain/offer';
import { offerChatKey } from '../domain/talk';
import type { BookingsDeps } from './ports';

// Who hears it: the driver, unless the driver ended it; the card of the request, unless the request
// closed and its card says so already.
type Told = { readonly driver: boolean; readonly card: boolean };

// One waiting offer is over for good and is told once: the status changes only from «sent», so a
// second call says nothing.
async function endOffer(deps: BookingsDeps, offer: OfferRecord, told: Told): Promise<void> {
  if (offer.status !== 'sent') return;
  if (!(await deps.offers.replace({ ...offer, status: 'expired' }, 'sent'))) return;
  const ended = { id: offer.id, chatKey: offerChatKey(offer), requestId: offer.requestId };
  if (told.driver) await deps.notify.offerExpired(offer.driverId, ended);
  // The passenger's card counts the offers left, the open Mini App follows (G89 T6).
  if (told.card) await deps.notify.requestChanged(offer.requestId);
}

// A request closed while drivers wait for the answer: another offer taken, the request cancelled or
// its day over (G75, docs/158 Й).
export async function endOffers(deps: BookingsDeps, requestId: string): Promise<void> {
  for (const offer of await deps.offers.byRequests([requestId]))
    await endOffer(deps, offer, { driver: true, card: false });
}

// The driver got a trip: one live trip at a time (owner decision 12.10.2026, docs/172), so the
// offers still waiting that would make another trip are over. The offers to this trip stay.
export async function endNewTripOffers(deps: BookingsDeps, driverId: number): Promise<void> {
  for (const offer of await deps.offers.byDriver(driverId))
    if (offer.tripId === null) await endOffer(deps, offer, { driver: true, card: true });
}

// The trip of the offers was cancelled, or their driver blocked (all of them): the passengers see
// the offers are over; the driver knows why (G64, G89 T6, B21).
export async function endDriverOffers(deps: BookingsDeps, driverId: number, tripId?: string): Promise<void> {
  for (const offer of await deps.offers.byDriver(driverId))
    if (tripId === undefined || offer.tripId === tripId)
      await endOffer(deps, offer, { driver: false, card: true });
}
