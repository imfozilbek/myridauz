import { tashkentDate, type Offer, type RideRequest } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { useEnds } from '../requests/ends';
import { useRequestDay } from '../requests/request-day';
import { WAYS } from '../requests/request-marks';

// The lines of a talk about a request (G64, mockups g64/2, g64/4, g64/5): the same words in the chat,
// in the call and on both sides.
export function useTalkTexts() {
  const { t, formatTime, formatNumber } = useI18n();
  const day = useRequestDay();
  const ends = useEnds();
  return {
    route: (way: Pick<RideRequest, 'from' | 'to'>) => t('requests.card.route', ends(way)),
    day,
    // «ertaga 08:00»: a line that starts with it gets its capital letter from the style.
    when: (departAt: number) =>
      t('requests.talk.when', { day: day(tashkentDate(departAt)), time: formatTime(new Date(departAt)) }),
    seats: (offer: Offer) =>
      offer.wholeCar ? t('requests.talk.salon') : t('find.carSeats', { count: String(offer.seats) }),
    // «2 kishi · 90 000 · Pitakdan · Boʻsh salon kerak»: the driver also sees the price and the way.
    facts: (request: RideRequest, driver: boolean) =>
      [
        t('market.request.seats', { count: String(request.seats) }),
        ...(driver ? [formatNumber(request.price), t(WAYS[request.pickupMode])] : []),
        ...(request.wholeCar ? [t('market.request.wholeCar')] : []),
      ].join(' · '),
  };
}
