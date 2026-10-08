import type { Offer } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { PersonBadge } from '../find/person-badge';
import { useOneAtATime } from '../telegram/one-at-a-time';
import { UzPlate } from '../plate/uz-plate';

const PHOTO = 44;

type Props = {
  readonly offer: Offer;
  // Each answer runs once: a second tap while it runs does nothing (docs/65 A4).
  readonly onAnswer: (action: 'accept' | 'decline') => Promise<unknown>;
  // The card itself opens the offer with its chat (docs/07).
  readonly onOpen: () => void;
};

// One offer of a driver (G61, mockup 3-offers A): the face, the rating, the car with its plate, the
// time and the share of a seat; «Rad etish» and «Qabul qilish» right in the card.
export function OfferCard({ offer, onAnswer, onOpen }: Props) {
  const { t, formatNumber, formatRating, formatTime } = useI18n();
  const { driver } = offer;
  const accept = useOneAtATime(() => onAnswer('accept'));
  const decline = useOneAtATime(() => onAnswer('decline'));
  const busy = accept.busy || decline.busy;
  // The model and the colour, as on the mockup: the make takes the line of the plate.
  const car = t('bookings.offer.car', {
    model: driver.car.model,
    color: t(`drivers.color.${driver.car.color}`),
  });
  return (
    <div className="offer-card">
      <button type="button" className="offer-card-top" onClick={onOpen}>
        <PersonBadge id={driver.id} name={driver.firstName} hasAvatar={driver.hasAvatar} size={PHOTO} plain />
        <span className="offer-card-who">
          <span className="offer-card-name">
            {driver.firstName}
            {driver.rating.average === null ? null : (
              <span className="offer-card-rating">
                {t('find.stars', { rating: formatRating(driver.rating.average) })}
              </span>
            )}
          </span>
          <span className="offer-card-car">
            {car}
            {driver.car.plate ? <UzPlate plate={driver.car.plate} size="s" /> : null}
          </span>
        </span>
        <span className="offer-card-when">
          <span className="offer-card-time">{formatTime(new Date(offer.departAt))}</span>
          <span className="offer-card-price">{formatNumber(offer.price)}</span>
        </span>
      </button>
      <span className="offer-card-answers">
        <button type="button" className="offer-card-decline" disabled={busy} onClick={decline.run}>
          {t('bookings.offer.decline')}
        </button>
        <button type="button" className="offer-card-accept" disabled={busy} onClick={accept.run}>
          {t('bookings.offer.accept')}
        </button>
      </span>
    </div>
  );
}
