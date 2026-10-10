import { offerChatKey } from '../domain/talk';
import type { BookingsDeps } from './ports';

// A request closed while drivers wait for the answer: another offer taken, the request cancelled or
// its day over (G75, docs/158 Й). Each offer still waiting is over for good and its driver hears it
// once: the status changes only from «sent», so a second call says nothing.
export async function endOffers(deps: BookingsDeps, requestId: string): Promise<void> {
  for (const offer of await deps.offers.byRequests([requestId])) {
    if (offer.status !== 'sent') continue;
    if (!(await deps.offers.replace({ ...offer, status: 'expired' }, 'sent'))) continue;
    await deps.notify.offerExpired(offer.driverId, {
      id: offer.id,
      chatKey: offerChatKey(offer),
      requestId,
    });
  }
}
