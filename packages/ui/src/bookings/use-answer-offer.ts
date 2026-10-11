import type { Offer, OfferAction } from '@platform/contracts';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { haptic } from '../telegram/feedback';

const STEP = { accept: 'offer_accepted', decline: 'offer_declined' } as const;

// The answer of a passenger to an offer (G77, docs/168 B): the sheet, «Mening soʻrovim», the sheet of
// the offer, the chat and the call answer the same way and the funnel counts it everywhere. A failure
// goes to the caller, which says why on its own screen.
export function useAnswerOffer(screen: string) {
  const { bookings } = useApiClients();
  const { track } = useAnalytics();
  return async (offer: Offer, action: OfferAction): Promise<Offer> => {
    const answered = await bookings.answerOffer(offer.id, action);
    track({ name: 'booking_step', screen, step: STEP[action] });
    haptic.success();
    return answered;
  };
}
