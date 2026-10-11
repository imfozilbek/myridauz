import { REQUEST_LINK, type Offer } from '@platform/contracts';
import { useAnalytics } from '../../context/analytics-context';
import { useApiClients } from '../../context/api-clients';
import { useI18n } from '../../context/i18n-context';
import type { HomeGo } from '../../flow/start-action';
import { waitingOffers } from '../../home/home-items';
import { usePassengerData } from '../../home/passenger-data';
import type { PlaceDirectory } from '../../places/directory';
import { haptic } from '../../telegram/feedback';
import { itemKey, type ActionItem } from '../action-item';
import { CarLine, TripBlock } from '../sheet-parts';
import { useSheetWords } from '../trip-line';

// «Yangi taklif» of a passenger (docs/122, mockup g68/8 «Taklif»): the driver with the car and its
// plate, the trip, how the driver picks up, the sum; «Qabul qilish» books the seat in one tap.
export function useOfferItems(directory: PlaceDirectory, go: HomeGo): ActionItem[] {
  const { t, formatNumber } = useI18n();
  const { bookings } = useApiClients();
  const { track } = useAnalytics();
  const { value, refresh } = usePassengerData();
  const words = useSheetWords(directory);
  if (!value) return [];
  const [, requests, offers] = value;
  const waiting = waitingOffers(requests, offers);
  const answer = async (offer: Offer, action: 'accept' | 'decline') => {
    await bookings.answerOffer(offer.id, action);
    track({
      name: 'booking_step',
      screen: 'sheet',
      step: action === 'accept' ? 'offer_accepted' : 'offer_declined',
    });
    haptic.success();
    refresh();
  };
  // One request is one thing to answer: its first offer, the others behind «Barcha takliflar (n)»
  // (mockup g68/8 «Taklif»). The bot rings with the first offer too (docs/122): the newest come
  // first in the list, so the first offer is the last of its request (G77).
  const firsts = waiting.filter(
    (offer, at) => waiting.findLastIndex((o) => o.requestId === offer.requestId) === at,
  );
  return firsts.map((offer) => {
    const { driver } = offer;
    const same = waiting.filter((other) => other.requestId === offer.requestId).length;
    const pickup = offer.pitak ? t('way.card.pitak', { pitak: offer.pitak }) : t('way.card.door');
    const color = t(`drivers.color.${driver.car.color}`);
    return {
      key: itemKey('offer', offer.id),
      kind: 'offer',
      face: { id: driver.id, name: driver.firstName, hasAvatar: driver.hasAvatar },
      badge: 'carSide',
      kicker: t('sheet.offer.kicker'),
      title:
        driver.rating.average === null
          ? driver.firstName
          : t('sheet.offer.rated', { name: driver.firstName, average: formatNumber(driver.rating.average) }),
      sub: (
        <CarLine
          car={t('sheet.car', { color, make: driver.car.make, model: driver.car.model })}
          plate={driver.car.plate}
        />
      ),
      body: (
        <TripBlock
          head={words.line(offer)}
          rows={[
            {
              label: pickup,
              value: offer.wholeCar ? t('sheet.salon') : t('sheet.seats', { seats: String(offer.seats) }),
            },
            {
              label: t('sheet.offer.perSeat', { price: formatNumber(offer.price) }),
              value: formatNumber(offer.price * offer.seats),
              strong: true,
            },
          ]}
        />
      ),
      main: {
        label: t('sheet.offer.accept'),
        run: async () => {
          await answer(offer, 'accept');
          return t('sheet.offer.accepted');
        },
      },
      second: {
        label: t('sheet.offer.decline'),
        run: async () => {
          await answer(offer, 'decline');
          return t('sheet.offer.declined');
        },
      },
      ...(same > 1
        ? {
            more: {
              label: t('sheet.offer.all', { count: String(same) }),
              run: () => {
                go('my_trips', { link: { name: REQUEST_LINK, id: offer.requestId } });
                return undefined;
              },
              aside: true,
            },
          }
        : {}),
    };
  });
}
