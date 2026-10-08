import type { Booking, Trip } from '@platform/contracts';
import { useScreenView } from '../context/analytics-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { Screen } from '../screen/screen';
import { ActionFailure } from '../states/action-failure';
import { MainButton } from '../telegram/bottom-button';
import { useScreenBackground } from '../telegram/screen-background';
import { brandVars } from '../theme/brand-vars';
import { RateRiders } from './rate-riders';
import { ridersOf, tripSums } from './trip-sums';
import { useRateRiders } from './use-rate-riders';
import { useSeatsLeft } from './use-seats-left';
import './trip-end.css';

// The flag of the badge and the wallet of its tile (mockup g63/4 screen 15).
const FLAG = 30;
const WALLET = 20;

type Props = {
  readonly trip: Trip;
  readonly bookings: readonly Booking[];
  // After «Yuborish»: the next step after the trip (docs/124 В: the review, then «Qaytish»).
  readonly onDone: () => void;
  // «Назад» leaves without the stars: back where the screen was opened from.
  readonly onBack: () => void;
};

// «Safar tugadi» of the driver, once after «Yetib keldik» (owner decision 06.10.2026, docs/124 В,
// mockup g63/4 screen 15): the people and the costs, what the wallet gave, the stars of each passenger.
export function TripDoneScreen({ trip, bookings, onDone, onBack }: Props) {
  useScreenView('trip_end.done');
  useScreenBackground();
  const { t, formatMoney, formatNumber } = useI18n();
  const { colors } = useBrand().theme;
  const sums = tripSums(bookings);
  const left = useSeatsLeft(trip.price);
  const toRate = ridersOf(bookings).filter((booking) => booking.rated !== true);
  const rate = useRateRiders(toRate, onDone);
  return (
    <div className="trip-end" style={brandVars(colors)}>
      <Screen onBack={onBack} />
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
      <ActionFailure error={rate.failure} />
      <MainButton text={t('reviews.send')} onClick={rate.send} />
    </div>
  );
}
