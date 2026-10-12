import type { Offer, OfferAction } from '@platform/contracts';
import { useI18n } from '../../context/i18n-context';
import type { PlaceDirectory } from '../../places/directory';
import { itemKey, type ActionItem } from '../action-item';
import { CarLine, TripBlock } from '../sheet-parts';
import { useSheetWords } from '../trip-line';

type Answer = (offer: Offer, action: OfferAction) => Promise<unknown>;

// «Yangi taklif» of a passenger (docs/122, mockup g68/8 «Taklif»): the driver with the car and its
// plate, the trip, how the driver picks up, the sum; «Qabul qilish» books the seat in one tap. One
// sheet on the main screen and over «Mening soʻrovim» (G78 sheet 2). same counts the offers of its
// request: more than one, «Barcha takliflar (n)» leads to them.
export function useOfferItem(directory: PlaceDirectory) {
  const { t, formatNumber } = useI18n();
  const words = useSheetWords(directory);
  return (offer: Offer, same: number, answer: Answer, onAll: () => void): ActionItem => {
    const { driver } = offer;
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
              run: () => (onAll(), undefined),
              aside: true,
            },
          }
        : {}),
    };
  };
}
