import { STARS, type Booking } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import './rate-riders.css';

const STAR = 12.8;

type Props = {
  readonly riders: readonly Booking[];
  // null: no stars chosen yet, five grey ones wait for a tap (G78 sheet 6).
  readonly starsOf: (booking: Booking) => number | null;
  readonly onChoose: (booking: Booking, stars: number) => void;
  // The booking of the bot link, on top and marked (G78 sheet 6).
  readonly marked?: string;
};

// «Yoʻlovchilarni baholang» (mockup g63/4 screen 15): each passenger with five stars side by side.
export function RateRiders({ riders, starsOf, onChoose, marked }: Props) {
  const { t } = useI18n();
  return (
    <section className="trip-end-card trip-end-rate">
      <b>{t('driverAfter.done.rate')}</b>
      <div className="trip-end-riders">
        {riders.map((booking) => {
          const stars = starsOf(booking);
          const name = booking.passenger.firstName;
          return (
            <span
              key={booking.id}
              className={booking.id === marked ? 'trip-end-rider trip-end-rider-marked' : 'trip-end-rider'}
            >
              {name}
              <span className={stars === null ? 'trip-end-stars trip-end-stars-wait' : 'trip-end-stars'}>
                {STARS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-label={`${name} ${value}`}
                    aria-pressed={value === stars}
                    onClick={() => onChoose(booking, value)}
                  >
                    <Icon name="star" size={STAR} filled={stars === null || value <= stars} />
                  </button>
                ))}
              </span>
            </span>
          );
        })}
      </div>
    </section>
  );
}
