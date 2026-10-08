import { afterTrip, type Booking, type Trip } from '@platform/contracts';
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
import { useDoneLine } from '../trip/done-line';
import { AfterRows, type AfterRow } from './after-rows';
import { PastRiders, pastRidersKey } from './past-riders';
import { PastTripCard } from './past-trip-card';
import { taken } from './trip-sums';
import { useReturnPlan } from './use-return-plan';
import '../meeting/no-show.css';
import './past-trip.css';

// The tick of «Safar tugadi» (mockup g63/5 phone 5).
const TICK = 16;

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
// A month later the plate is grey, as on the booking of the passenger (g60/6).
export function PastTripPage({ trip, bookings, onBack, onChat, onCall, onRow, onPublish }: Props) {
  useScreenView('trip_end.past');
  useScreenBackground();
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  const directory = usePlaces();
  const done = useDoneLine(trip, directory.find(trip.to)?.name ?? trip.to);
  const riders = bookings.filter(taken);
  const { now, draft } = useReturnPlan(trip);
  const talk = now < afterTrip(trip.departAt, trip.km).talkUntil;
  const seats = riders.reduce((sum, booking) => sum + booking.seats, 0);
  return (
    <div className="past-trip" style={brandVars(colors)}>
      <Screen onBack={onBack} />
      <div className={done.old ? 'past-banner past-banner-old' : 'past-banner'}>
        <Icon name="selected" size={TICK} />
        <span className="past-banner-text">
          <b>{t('bookings.done.title')}</b>
          <span>{done.line}</span>
        </span>
      </div>
      <h2 className="past-head">{t('driverAfter.past.riders', { count: String(seats) })}</h2>
      <PastRiders key={pastRidersKey(riders)} riders={riders} talk={talk} onChat={onChat} onCall={onCall} />
      <h2 className="past-head">{t('driverAfter.past.trip')}</h2>
      <PastTripCard trip={trip} />
      <h2 className="past-head">{t('driverAfter.past.after')}</h2>
      <AfterRows trip={trip} bookings={bookings} now={now} onRow={onRow} />
      {draft ? <MainButton text={t('driverAfter.back.publish')} onClick={() => onPublish(draft)} /> : null}
    </div>
  );
}
