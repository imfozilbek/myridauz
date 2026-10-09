import { MY_TRIP_LINK, NEW_TRIP_SECTION, type Trip } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { usePending } from '../driver/driver-context';
import type { HomeGo } from '../flow/start-action';
import { tripStep, type TripStep } from '../own-trip/trip-stage';
import { useNow } from '../own-trip/use-now';
import { useTripSteps } from '../own-trip/use-trip-steps';
import { usePlaceNames } from '../places/place-names';
import type { PlaceDirectory } from '../places/directory';
import { useDirectory } from '../places/use-directory';
import { ActionFailure } from '../states/action-failure';
import { MainButton } from '../telegram/bottom-button';
import { useAnySheet } from '../telegram/sheet-shown';
import { useDockEnds } from './dock-ends';
import { DOCK_FROM, DOCK_TO } from './dock-sections';
import { useDriverData } from './driver-data';
import { todayTrip } from './driver-day';
import { RouteDock } from './route-dock';
import { useHomeTap } from './use-home-tap';

// The bottom of the main screen of a driver (G66, mockup g66/2): from the hour before the trip of
// today, when the server takes it (docs/35), only its step, «Yoʻlga chiqdim» then «Yetib keldik»;
// before it «Qayerdan / Qayerga» and «Safar eʼlon qilish», inert with «Tekshiruvdan keyin ochiladi»
// while the application is checked. The time moves on by itself: the step comes on an open screen.
export function DriverDock({ go }: { readonly go: HomeGo }) {
  const load = useDriverData();
  const [places] = useDirectory();
  const now = useNow();
  const today = load.value ? todayTrip(load.value[0], now) : undefined;
  const next = today ? tripStep(today, now) : null;
  if (today && next) return <TripDay trip={today} next={next} go={go} onChanged={load.refresh} />;
  return <PublishDock go={go} directory={places.status === 'ready' ? places.directory : null} />;
}

type DayProps = {
  readonly trip: Trip;
  readonly next: TripStep;
  readonly go: HomeGo;
  readonly onChanged: () => void;
};

function TripDay({ trip, next, go, onChanged }: DayProps) {
  const { t } = useI18n();
  const sheet = useAnySheet();
  const opened = () => go('my_trips', { link: { name: MY_TRIP_LINK, id: trip.id } });
  const { step, failure } = useTripSteps({ trip, onChanged, onArrived: opened });
  return (
    <>
      {failure ? (
        <div className="home-dock-failure">
          <ActionFailure error={failure} />
        </div>
      ) : null}
      {sheet ? null : <MainButton text={t(`driverTrip.main.${next}`)} onClick={() => step(next)} />}
    </>
  );
}

type PublishProps = { readonly go: HomeGo; readonly directory: PlaceDirectory | null };

function PublishDock({ go, directory }: PublishProps) {
  const { t } = useI18n();
  const sheet = useAnySheet();
  const pending = usePending();
  const tap = useHomeTap();
  const names = usePlaceNames(directory);
  const ends = useDockEnds(directory);
  const { from, to } = ends;
  const publish = () => go(NEW_TRIP_SECTION, from && to ? { route: { from, to } } : undefined);
  return (
    <>
      <RouteDock
        from={{
          value: from ? names.from(from) : null,
          placeholder: t('way.fromEmpty'),
          ...(ends.detected ? { hint: t('home.dock.here') } : {}),
          onTap: tap('dock_from', () => go(DOCK_FROM)),
        }}
        to={{
          value: to ? names.toward(to) : null,
          placeholder: t('home.dock.toDriver'),
          onTap: tap('dock_to', () => go(DOCK_TO)),
        }}
        onSwap={tap('dock_swap', ends.swap)}
      />
      {sheet ? null : pending ? (
        <MainButton text={t('home.dock.afterCheck')} onClick={() => undefined} disabled />
      ) : (
        <MainButton text={t('home.publish')} onClick={tap('main_button', publish)} />
      )}
    </>
  );
}
