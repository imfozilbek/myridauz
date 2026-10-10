import type { Offer } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { useI18n } from '../context/i18n-context';
import { PersonBadge } from '../find/person-badge';
import { UzPlate } from '../plate/uz-plate';
import { FormSheet } from '../sheet/form-sheet';
import { ActionFailure } from '../states/action-failure';
import { MainButton } from '../telegram/bottom-button';
import './passenger-offer-sheet.css';

const FACE = 52;

type Props = {
  readonly offer: Offer | null;
  // A failed answer stays in the sheet with its reason (docs/65 B3).
  readonly failure: TranslationKey | null;
  readonly onAccept: (offer: Offer) => unknown;
  readonly onDecline: (offer: Offer) => unknown;
  readonly onChat: (offer: Offer) => void;
  readonly onClose: () => void;
};

// One offer of a driver over «Mening soʻrovim» (G75, mockup g75/4 B phone 2): the face, the car with
// its plate, the time and the sum; «Rad etish» and «Qabul qilish»; the chat stays one tap away.
export function PassengerOfferSheet({ offer, failure, onAccept, onDecline, onChat, onClose }: Props) {
  const { t } = useI18n();
  return (
    <FormSheet
      open={offer !== null}
      {...(offer ? { title: t('bookings.offer.sent', { name: offer.driver.firstName }) } : {})}
      onClose={onClose}
    >
      {offer ? (
        <>
          <OfferBody offer={offer} />
          <ActionFailure error={failure} />
          <button type="button" className="form-sheet-link" onClick={() => onChat(offer)}>
            {t('chat.open')}
          </button>
          <button
            type="button"
            className="form-sheet-link offer-sheet-decline"
            onClick={() => onDecline(offer)}
          >
            {t('bookings.offer.decline')}
          </button>
          <MainButton text={t('bookings.offer.accept')} onClick={() => onAccept(offer)} />
        </>
      ) : null}
    </FormSheet>
  );
}

function OfferBody({ offer }: { readonly offer: Offer }) {
  const { t, formatNumber, formatMoney, formatRating, formatTime } = useI18n();
  const { driver } = offer;
  const car = t('bookings.offer.car', {
    model: driver.car.model,
    color: t(`drivers.color.${driver.car.color}`),
  });
  return (
    <div className="offer-sheet-card">
      <div className="offer-sheet-head">
        <PersonBadge id={driver.id} name={driver.firstName} hasAvatar={driver.hasAvatar} size={FACE} plain />
        <span className="offer-sheet-who">
          <b>
            {driver.firstName}
            {driver.rating.average === null ? null : (
              <span className="offer-sheet-rating">
                {t('find.stars', { rating: formatRating(driver.rating.average) })}
              </span>
            )}
          </b>
          <span className="offer-sheet-car">{car}</span>
          {driver.car.plate ? <UzPlate plate={driver.car.plate} size="s" /> : null}
        </span>
      </div>
      <p className="offer-sheet-row">
        <span>{t('bookings.offer.when')}</span>
        <b>{formatTime(new Date(offer.departAt))}</b>
      </p>
      <p className="offer-sheet-row">
        <span>
          {t('sheet.request.price', { seats: String(offer.seats), price: formatNumber(offer.price) })}
        </span>
        <b>{formatMoney(offer.price * offer.seats)}</b>
      </p>
    </div>
  );
}
