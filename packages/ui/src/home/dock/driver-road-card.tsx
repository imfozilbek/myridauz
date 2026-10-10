import type { Booking, Trip } from '@platform/contracts';
import { stopsInOrder } from '../../bookings/driver-stops';
import { NavigatorSheet } from '../../bookings/navigator-sheet';
import { useNavigator } from '../../bookings/use-navigator';
import { useI18n } from '../../context/i18n-context';
import { useTripSteps } from '../../own-trip/use-trip-steps';
import { MainButton, SecondaryButton } from '../../telegram/bottom-button';
import { useNameText } from '../../way/way-end';
import { DockCard } from './dock-card';

type Props = {
  readonly trip: Trip;
  readonly people: readonly Booking[];
  readonly onChanged: () => void;
};

// On the road (state 14): who leaves next and where, the navigator, «Yetib keldik».
export function RoadCard({ trip, people, onChanged }: Props) {
  const { t } = useI18n();
  const nameText = useNameText();
  const steps = useTripSteps({ trip, onChanged, onArrived: onChanged });
  const navigator = useNavigator();
  const riders = people.filter((booking) => booking.status === 'confirmed' || booking.status === 'completed');
  const done = riders.filter((booking) => booking.arrivedAt !== null).length;
  const stops = stopsInOrder(riders, null).dropoffs;
  const next = stops.find((stop) => stop.riders.some((booking) => booking.arrivedAt === null));
  const place = next?.name ? nameText(next.name, trip.to) : '';
  const title = t('home.dock.onRoadOf', {
    title: t('driverTrip.onWay.title'),
    done: String(done),
    all: String(riders.length),
  });
  return (
    <>
      <DockCard chip={title} chipTone="green" title={t('home.dock.next', { place })} text={next?.who ?? ''} />
      <NavigatorSheet navigator={navigator} />
      <SecondaryButton
        beside
        text={t('account.profile.navigator')}
        onClick={() => navigator.go(stops.map((stop) => stop.point))}
      />
      <MainButton text={t('driverTrip.main.arrived')} onClick={() => void steps.step('arrived')} />
    </>
  );
}
