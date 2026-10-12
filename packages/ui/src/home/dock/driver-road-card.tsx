import type { Booking, Trip } from '@platform/contracts';
import { NavigatorSheet } from '../../bookings/navigator-sheet';
import { useNavigator } from '../../bookings/use-navigator';
import { useI18n } from '../../context/i18n-context';
import { ActionFailure } from '../../states/action-failure';
import { useRoadNext } from '../../own-trip/use-road-next';
import { useTripSteps } from '../../own-trip/use-trip-steps';
import { MainButton, SecondaryButton } from '../../telegram/bottom-button';
import { DockCard } from './dock-card';
import type { TripActions } from './trip-actions';

type Props = {
  readonly trip: Trip;
  readonly people: readonly Booking[];
  readonly act: TripActions;
  readonly onChanged: () => void;
};

// On the road (state 14): the next point and who is there (useRoadNext, the same on «Mening
// safarim», G78 В2), the navigator. «Men keldim» at a pickup, then «Yetib keldik», «Safar tugadi»
// and «Qaytish» after it, as on «Mening safarim» (docs/124 В).
export function RoadCard({ trip, people, act, onChanged }: Props) {
  const { t } = useI18n();
  const steps = useTripSteps({ trip, onChanged, onArrived: act.open(trip, 'end') });
  const navigator = useNavigator();
  const road = useRoadNext(trip, people);
  return (
    <>
      <DockCard
        chip={road.chip}
        chipTone="green"
        title={t('home.dock.next', { place: road.place })}
        text={road.who}
      />
      <NavigatorSheet navigator={navigator} />
      <SecondaryButton
        beside
        text={t('account.profile.navigator')}
        onClick={() => navigator.go(road.stops.map((stop) => stop.point))}
      />
      {road.came.length > 0 ? (
        <MainButton text={t('bookings.meeting.came')} onClick={act.cameAll(road.came)} />
      ) : (
        <MainButton text={t('driverTrip.main.arrived')} onClick={() => void steps.step('arrived')} />
      )}
      <ActionFailure error={steps.failure} />
    </>
  );
}
