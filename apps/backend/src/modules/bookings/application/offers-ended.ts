import type { OfferRecord } from '../domain/offer';
import { offerChatKey } from '../domain/talk';
import type { BookingsDeps } from './ports';

// One waiting offer is over for good and its driver hears it once: the status changes only from
// «sent», so a second call says nothing.
async function endOffer(deps: BookingsDeps, offer: OfferRecord): Promise<void> {
  if (offer.status !== 'sent') return;
  if (!(await deps.offers.replace({ ...offer, status: 'expired' }, 'sent'))) return;
  await deps.notify.offerExpired(offer.driverId, {
    id: offer.id,
    chatKey: offerChatKey(offer),
    requestId: offer.requestId,
  });
}

// A request closed while drivers wait for the answer: another offer taken, the request cancelled or
// its day over (G75, docs/158 Й).
export async function endOffers(deps: BookingsDeps, requestId: string): Promise<void> {
  for (const offer of await deps.offers.byRequests([requestId])) await endOffer(deps, offer);
}

// The driver got a trip: one live trip at a time (owner decision 12.10.2026, docs/172), so the
// offers still waiting that would make another trip are over. The offers to this trip stay.
export async function endNewTripOffers(deps: BookingsDeps, driverId: number): Promise<void> {
  for (const offer of await deps.offers.byDriver(driverId))
    if (offer.tripId === null) await endOffer(deps, offer);
}
