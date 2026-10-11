import type { Booking, Trip } from '@platform/contracts';
import { stopsInOrder } from '../../bookings/driver-stops';
import { NavigatorSheet } from '../../bookings/navigator-sheet';
import { useNavigator } from '../../bookings/use-navigator';
import { useI18n } from '../../context/i18n-context';
import { meetStep } from '../../meeting/meet-state';
import { ActionFailure } from '../../states/action-failure';
import { useTripSteps } from '../../own-trip/use-trip-steps';
import { MainButton, SecondaryButton } from '../../telegram/bottom-button';
import { useNameText } from '../../way/way-end';
import { DockCard } from './dock-card';
import type { TripActions } from './trip-actions';

type Props = {
  readonly trip: Trip;
  readonly people: readonly Booking[];
  readonly act: TripActions;
  readonly onChanged: () => void;
};

// On the road (state 14): the next point and who is there, the navigator. The points to pick up
// come first with «Men keldim» (G77, docs/170 О1), then the dropoffs with «Yetib keldik», «Safar
// tugadi» and «Qaytish» after it, as on «Mening safarim» (docs/124 В).
export function RoadCard({ trip, people, act, onChanged }: Props) {
  const { t } = useI18n();
  const nameText = useNameText();
  const steps = useTripSteps({ trip, onChanged, onArrived: act.open(trip, 'end') });
  const navigator = useNavigator();
  const riders = people.filter((booking) => booking.status === 'confirmed' || booking.status === 'completed');
  const done = riders.filter((booking) => booking.arrivedAt !== null).length;
  const { pickups, dropoffs } = stopsInOrder(riders, null);
  // Who the driver has not come to yet at a point (docs/126).
  const waiting = (stop: (typeof pickups)[number]) => stop.riders.filter((one) => meetStep(one) === 'come');
  const pickup = pickups.find((stop) => waiting(stop).length > 0);
  const stops = pickup ? pickups.filter((stop) => waiting(stop).length > 0) : dropoffs;
  const next = pickup ?? stops.find((stop) => stop.riders.some((booking) => booking.arrivedAt === null));
  const place = next?.name ? nameText(next.name, pickup ? trip.from : trip.to) : (next?.who ?? '');
  // At a pitak the place is its name: under it who waits there, as on the card of the stop.
  const who = pickup
    ? waiting(pickup)
        .map((one) => one.passenger.firstName)
        .join(', ')
    : (next?.who ?? '');
  const title = t('home.dock.onRoadOf', {
    title: t('driverTrip.onWay.title'),
    done: String(done),
    all: String(riders.length),
  });
  return (
    <>
      <DockCard chip={title} chipTone="green" title={t('home.dock.next', { place })} text={who} />
      <NavigatorSheet navigator={navigator} />
      <SecondaryButton
        beside
        text={t('account.profile.navigator')}
        onClick={() => navigator.go(stops.map((stop) => stop.point))}
      />
      {pickup ? (
        <MainButton text={t('bookings.meeting.came')} onClick={act.cameAll(waiting(pickup))} />
      ) : (
        <MainButton text={t('driverTrip.main.arrived')} onClick={() => void steps.step('arrived')} />
      )}
      <ActionFailure error={steps.failure} />
    </>
  );
}
