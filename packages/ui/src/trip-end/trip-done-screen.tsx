import type { Booking, Trip } from '@platform/contracts';
import { useScreenView } from '../context/analytics-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { Screen } from '../screen/screen';
import { ActionFailure } from '../states/action-failure';
import { MainButton, SecondaryButton } from '../telegram/bottom-button';
import { useScreenBackground } from '../telegram/screen-background';
import { brandVars } from '../theme/brand-vars';
import { RateRiders } from './rate-riders';
import { ReturnCard } from './return-card';
import type { ReturnTrip } from './return-plan';
import { ridersOf, tripSums } from './trip-sums';
import { useRateRiders } from './use-rate-riders';
import { useReturnPlan } from './use-return-plan';
import { useSeatsLeft } from './use-seats-left';
import './trip-end.css';

// The flag of the badge and the wallet of its tile (mockup g63/4 screen 15).
const FLAG = 31.5;
const WALLET = 20;

type Props = {
  readonly trip: Trip;
  readonly bookings: readonly Booking[];
  // The one screen of the publishing with the way back filled in (G63 C1).
  readonly onPublish: (back: ReturnTrip) => void;
  // «Назад» leaves without the stars; «Yuborish» leaves after them: back where it was opened from.
  readonly onClose: () => void;
  // The stars went to the server: the list brings the bookings marked rated (docs/24), so the past
  // trip shows them and does not offer them again.
  readonly onRated: () => void;
};

// «Safar tugadi» of the driver, once after «Yetib keldik» (owner decision 06.10.2026, docs/124 В,
// mockup g63/4 screen 15): the people and the costs, what the wallet gave, the stars of each passenger,
// and the way back under them (G78 В10 A): «Qaytish safari» sends the stars and publishes it.
export function TripDoneScreen({ trip, bookings, onPublish, onClose, onRated }: Props) {
  useScreenView('trip_end.done');
  useScreenBackground();
  const { t, formatMoney, formatNumber } = useI18n();
  const { colors } = useBrand().theme;
  const sums = tripSums(bookings);
  const left = useSeatsLeft(trip.price);
  const toRate = ridersOf(bookings).filter((booking) => booking.rated !== true);
  const rate = useRateRiders(toRate);
  const plan = useReturnPlan(trip);
  const { back } = plan;
  return (
    <div className="trip-end" style={brandVars(colors)}>
      <Screen onBack={onClose} />
      <span className="trip-end-badge">
        <Icon name="arrived" size={FLAG} />
      </span>
      <h1 className="trip-end-title">{t('bookings.done.title')}</h1>
      <p className="trip-end-sub">
        {t('driverAfter.done.sum', {
          passengers: String(sums.passengers),
          sum: formatMoney(sums.costs),
        })}
      </p>
      <div className="trip-end-card trip-end-wallet">
        <span className="trip-end-tile">
          <Icon name="walletPlain" size={WALLET} />
        </span>
        <span className="trip-end-wallet-text">
          <b>{t('driverAfter.done.charged', { amount: formatNumber(sums.charged) })}</b>
          {left === null ? null : <span>{t('driverAfter.done.left', { seats: String(left) })}</span>}
        </span>
      </div>
      {toRate.length > 0 ? (
        <RateRiders riders={toRate} starsOf={rate.starsOf} onChoose={rate.choose} />
      ) : null}
      {back ? <ReturnCard trip={trip} plan={plan} /> : null}
      <ActionFailure error={rate.failure} />
      {back ? (
        <SecondaryButton
          beside
          text={t('driverAfter.back.trip')}
          onClick={() => rate.send(() => (onRated(), onPublish(back)))}
        />
      ) : null}
      <MainButton text={t('reviews.send')} onClick={() => rate.send(() => (onRated(), onClose()))} />
    </div>
  );
}
