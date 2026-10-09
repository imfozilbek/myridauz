import { DAY_MS, meetingStartsAt, tashkentDate, type Booking, type Location } from '@platform/contracts';
import { passengerStep, useTripSteps } from '../bookings/use-trip-steps';
import { useI18n } from '../context/i18n-context';
import { useTripDays } from '../find/use-trip-days';
import type { HomeGo } from '../flow/start-action';
import { rememberRoute } from '../market/recent-routes';
import { usePlaceNames } from '../places/place-names';
import type { PlaceDirectory } from '../places/directory';
import { useDirectory } from '../places/use-directory';
import { ActionFailure } from '../states/action-failure';
import { MainButton } from '../telegram/bottom-button';
import { useAnySheet } from '../telegram/sheet-shown';
import { useDockEnds } from './dock-ends';
import { DOCK_FROM, DOCK_TO } from './dock-sections';
import { usePassengerData } from './passenger-data';
import { RouteDock } from './route-dock';
import { useHomeTap } from './use-home-tap';

// The bottom of the main screen of a passenger (G66, mockup g66/1): from the meeting on (30 minutes
// before the departure, with its card, docs/126) the step of the trip alone, «Mashinaga chiqdim» then
// «Yetib keldim»; before it «Qayerdan / Qayerga» and «Safar topish», so a tap in the morning never
// tells the driver and the close ones a seat taken too early.
export function PassengerDock({ go }: { readonly go: HomeGo }) {
  const load = usePassengerData();
  const [places] = useDirectory();
  const now = Date.now();
  const today = (load.value?.[0] ?? []).find((booking) => stepNow(booking, now));
  if (today) return <TripStep booking={today} onTold={load.refresh} />;
  return <FindDock go={go} directory={places.status === 'ready' ? places.directory : null} />;
}

const stepNow = (booking: Booking, now: number) => {
  const step = passengerStep(booking, now);
  return step === 'arrived' || (step === 'boarded' && now >= meetingStartsAt(booking.trip.departAt));
};

function TripStep({ booking, onTold }: { readonly booking: Booking; readonly onTold: () => void }) {
  const { t } = useI18n();
  const sheet = useAnySheet();
  const steps = useTripSteps(booking, onTold);
  return (
    <>
      {steps.failure ? (
        <div className="home-dock-failure">
          <ActionFailure error={steps.failure} />
        </div>
      ) : null}
      {steps.next && !sheet ? <MainButton text={t(`share.${steps.next}`)} onClick={steps.step} /> : null}
    </>
  );
}

type FindProps = { readonly go: HomeGo; readonly directory: PlaceDirectory | null };

function FindDock({ go, directory }: FindProps) {
  const { t } = useI18n();
  const sheet = useAnySheet();
  const tap = useHomeTap();
  const ends = useDockEnds(directory);
  const { from, to } = ends;
  const names = useNames(directory);
  const find = () => {
    if (from && to) {
      rememberRoute({ from, to });
      return go('find_trip', { route: { from, to } });
    }
    return go('find_trip', { pick: from ? 'to' : 'from' });
  };
  return (
    <>
      <RouteDock
        from={{
          value: from ? names(from, 'from') : null,
          placeholder: t('way.fromEmpty'),
          ...(ends.detected ? { hint: t('home.dock.here') } : {}),
          onTap: tap('dock_from', () => go(DOCK_FROM)),
        }}
        to={{
          value: to ? names(to, 'to') : null,
          placeholder: t('way.toEmpty'),
          ...(from && to ? { hint: <TripCount from={from} to={to} /> } : {}),
          onTap: tap('dock_to', () => go(DOCK_TO)),
        }}
        onSwap={tap('dock_swap', ends.swap)}
      />
      {sheet ? null : <MainButton text={t('common.passenger.findTrip')} onClick={tap('main_button', find)} />}
    </>
  );
}

// «Chilonzor, Toshkent» and «Samarqand», as on the mockup and by the route rule (docs/121).
function useNames(directory: PlaceDirectory | null) {
  const names = usePlaceNames(directory);
  return (place: Location, end: 'from' | 'to') => (end === 'from' ? names.from(place) : names.toward(place));
}

// «Bugun 3, ertaga 8 ta safar» under the chosen «Qayerga» (mockup g66/1 phone 2).
function TripCount({ from, to }: { readonly from: Location; readonly to: Location }) {
  const { t } = useI18n();
  const { value } = useTripDays({ from, to });
  if (!value) return null;
  const today = tashkentDate(Date.now());
  const tomorrow = tashkentDate(Date.now() + DAY_MS);
  const count = (date: string) => String(value.days.find((day) => day.date === date)?.trips ?? 0);
  return <>{t('home.dock.trips', { today: count(today), tomorrow: count(tomorrow) })}</>;
}
