import { STARS, type Booking } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';

const STAR = 12;

type Props = {
  readonly riders: readonly Booking[];
  readonly starsOf: (booking: Booking) => number;
  readonly onChoose: (booking: Booking, stars: number) => void;
};

// «Yoʻlovchilarni baholang» (mockup g63/4 screen 15): each passenger with five stars side by side.
export function RateRiders({ riders, starsOf, onChoose }: Props) {
  const { t } = useI18n();
  return (
    <section className="trip-end-card trip-end-rate">
      <b>{t('driverAfter.done.rate')}</b>
      <div className="trip-end-riders">
        {riders.map((booking) => (
          <span key={booking.id} className="trip-end-rider">
            {booking.passenger.firstName}
            <span className="trip-end-stars">
              {STARS.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-label={`${booking.passenger.firstName} ${value}`}
                  aria-pressed={value === starsOf(booking)}
                  onClick={() => onChoose(booking, value)}
                >
                  <Icon name="star" size={STAR} filled={value <= starsOf(booking)} />
                </button>
              ))}
            </span>
          </span>
        ))}
      </div>
    </section>
  );
}
