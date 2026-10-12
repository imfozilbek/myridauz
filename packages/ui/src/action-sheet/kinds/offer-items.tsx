import { BOOKING_LINK, REQUEST_LINK, type Offer, type OfferAction } from '@platform/contracts';
import { useAnswerOffer } from '../../bookings/use-answer-offer';
import type { HomeGo } from '../../flow/start-action';
import { waitingOffers } from '../../home/home-items';
import { usePassengerData } from '../../home/passenger-data';
import type { PlaceDirectory } from '../../places/directory';
import type { ActionItem } from '../action-item';
import { useOfferItem } from './offer-item';

// The offers a passenger has not answered yet, one sheet for each request (docs/122).
export function useOfferItems(directory: PlaceDirectory, go: HomeGo): ActionItem[] {
  const answerOffer = useAnswerOffer('sheet');
  const { value, refresh } = usePassengerData();
  const item = useOfferItem(directory);
  if (!value) return [];
  const [, requests, offers] = value;
  const waiting = waitingOffers(requests, offers);
  // An accepted offer opens its seat, as «Mening soʻrovim» does (G77).
  const answer = async (offer: Offer, action: OfferAction) => {
    const answered = await answerOffer(offer, action);
    refresh();
    if (answered.bookingId) go('my_trips', { link: { name: BOOKING_LINK, id: answered.bookingId } });
  };
  // One request is one thing to answer: its first offer, the others behind «Barcha takliflar (n)»
  // (mockup g68/8 «Taklif»). The bot rings with the first offer too (docs/122): the newest come
  // first in the list, so the first offer is the last of its request (G77).
  const firsts = waiting.filter(
    (offer, at) => waiting.findLastIndex((o) => o.requestId === offer.requestId) === at,
  );
  return firsts.map((offer) =>
    item(offer, waiting.filter((other) => other.requestId === offer.requestId).length, answer, () =>
      go('my_trips', { link: { name: REQUEST_LINK, id: offer.requestId } }),
    ),
  );
}
