import { afterTrip, type Booking, type Trip } from '@platform/contracts';
import type { ReactNode } from 'react';
import { useScreenView } from '../context/analytics-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { usePlaces } from '../market/places-gate';
import { Screen } from '../screen/screen';
import { MainButton } from '../telegram/bottom-button';
import { useScreenBackground } from '../telegram/screen-background';
import { brandVars } from '../theme/brand-vars';
import { useDoneLine } from '../trip/done-line';
import { OwnTripCard } from '../trip/own-trip-card';
import { AfterRows, type AfterRow } from './after-rows';
import { PastRiders, pastRidersKey } from './past-riders';
import type { ReturnTrip } from './return-plan';
import { taken } from './trip-sums';
import { useReturnPlan } from './use-return-plan';
import '../meeting/no-show.css';
import '../own-trip/own-trip.css';
import '../own-trip/own-trip-people.css';
import './past-trip.css';

// The tick of «Safar tugadi», as on the green plates of «Mening safarim» (mockup g63/5 phone 5).
const TICK = 20;

type Props = {
  readonly trip: Trip;
  readonly bookings: readonly Booking[];
  readonly onBack: () => void;
  readonly onChat: (booking: Booking) => void;
  readonly onCall: (booking: Booking) => void;
  readonly onMark: (booking: Booking) => void;
  readonly onRow: (row: AfterRow) => void;
  readonly onPublish: (back: ReturnTrip) => void;
  // The failure of «Kelmadi», under what may still be done.
  readonly children?: ReactNode;
};

// The past trip of the driver (owner decision 06.10.2026, docs/129, mockup g63/5 phone 5) in the
// parts of «Mening safarim»: the plate of the end, the passengers with their stars or the refund, the
// trip, what may still be done. A month later the plate is grey, as on the booking of g60/6.
export function PastTripPage(props: Props) {
  const { trip, bookings, onBack, onChat, onCall, onMark, onRow, onPublish, children } = props;
  useScreenView('trip_end.past');
  useScreenBackground();
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  const directory = usePlaces();
  const done = useDoneLine(trip, directory.find(trip.to)?.name ?? trip.to);
  const riders = bookings.filter(taken);
  const { now, back } = useReturnPlan(trip);
  const talk = now < afterTrip(trip.departAt, trip.km).talkUntil;
  const seats = riders.reduce((sum, booking) => sum + booking.seats, 0);
  return (
    <div className="own-trip past-trip" style={brandVars(colors)}>
      <Screen onBack={onBack} />
      <div className="own-banner" data-stage={done.old ? 'over' : 'done'}>
        <Icon name="selected" size={TICK} />
        <span className="own-banner-text">
          <b>{t('bookings.done.title')}</b>
          <span>{done.line}</span>
        </span>
      </div>
      <h2 className="own-head">{t('driverTrip.passengers', { count: String(seats) })}</h2>
      <PastRiders key={pastRidersKey(riders)} {...{ riders, talk, onChat, onCall, now, onMark }} />
      <h2 className="own-head">{t('driverTrip.trip')}</h2>
      <OwnTripCard trip={trip} />
      <h2 className="own-head">{t('driverAfter.past.after')}</h2>
      <AfterRows trip={trip} bookings={bookings} now={now} onRow={onRow} />
      {children}
      {back ? <MainButton text={t('driverAfter.back.publish')} onClick={() => onPublish(back)} /> : null}
    </div>
  );
}
