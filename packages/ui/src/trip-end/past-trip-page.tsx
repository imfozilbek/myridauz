import { arrivalAt, type Booking, type Trip } from '@platform/contracts';
import { useScreenView } from '../context/analytics-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { usePlaces } from '../market/places-gate';
import type { TripDraft } from '../market/trip-draft';
import { Screen } from '../screen/screen';
import { MainButton } from '../telegram/bottom-button';
import { useScreenBackground } from '../telegram/screen-background';
import { brandVars } from '../theme/brand-vars';
import { AfterRows, type AfterRow } from './after-rows';
import { PastRider } from './past-rider';
import { PastTripCard } from './past-trip-card';
import { useGivenStars } from './use-given-stars';
import { useReturnPlan } from './use-return-plan';
import '../meeting/no-show.css';
import './past-trip.css';

const taken = (booking: Booking) => booking.status === 'confirmed' || booking.status === 'completed';

type Props = {
  readonly trip: Trip;
  readonly bookings: readonly Booking[];
  readonly onBack: () => void;
  readonly onChat: (booking: Booking) => void;
  readonly onCall: (booking: Booking) => void;
  readonly onRow: (row: AfterRow) => void;
  readonly onPublish: (draft: Partial<TripDraft>) => void;
};

// The past trip of the driver (owner decision 06.10.2026, docs/129, mockup g63/5 phone 5): when and
// where it ended, the passengers with their stars or the refund, the trip, what may still be done.
export function PastTripPage({ trip, bookings, onBack, onChat, onCall, onRow, onPublish }: Props) {
  useScreenView('trip_end.past');
  useScreenBackground();
  const { t, formatDate, formatTime } = useI18n();
  const { colors } = useBrand().theme;
  const directory = usePlaces();
  const riders = bookings.filter(taken);
  const stars = useGivenStars(riders);
  const { now, draft } = useReturnPlan(trip);
  const arrival = new Date(arrivalAt(trip.departAt, trip.km));
  const place = directory.find(trip.to)?.name ?? trip.to;
  const seats = riders.reduce((sum, booking) => sum + booking.seats, 0);
  return (
    <div className="past-trip" style={brandVars(colors)}>
      <Screen onBack={onBack} />
      <div className="past-banner">
        <Icon name="selected" size={16} />
        <span className="past-banner-text">
          <b>{t('bookings.done.title')}</b>
          <span>
            {t('bookings.done.when', { date: formatDate(arrival), time: formatTime(arrival), place })}
          </span>
        </span>
      </div>
      <h2 className="past-head">{t('driverAfter.past.riders', { count: String(seats) })}</h2>
      <div className="past-riders">
        {riders.map((booking) => (
          <PastRider
            key={booking.id}
            booking={booking}
            stars={stars.get(booking.id)}
            onChat={() => onChat(booking)}
            onCall={() => onCall(booking)}
          />
        ))}
      </div>
      <h2 className="past-head">{t('driverAfter.past.trip')}</h2>
      <PastTripCard trip={trip} />
      <h2 className="past-head">{t('driverAfter.past.after')}</h2>
      <AfterRows trip={trip} bookings={bookings} now={now} onRow={onRow} />
      {draft ? <MainButton text={t('driverAfter.back.publish')} onClick={() => onPublish(draft)} /> : null}
    </div>
  );
}
