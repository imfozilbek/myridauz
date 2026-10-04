import { MY_TRIP_LINK, type Trip } from '@platform/contracts';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { usePending } from '../driver/driver-context';
import type { HomeGo, Launch } from '../flow/start-action';
import type { PlaceDirectory } from '../places/directory';
import { useDirectory } from '../places/use-directory';
import { Screen } from '../screen/screen';
import { HomeRowCard } from './home-card';
import { HomeFailed, HomeLoading } from './home-state';
import { HomeTrips } from './home-trips';
import { useDriverData, type DriverLoad } from './driver-data';
import { againOf, lastTrip, nextTrips, type DriverItem } from './home-items';
import { useHomeTap } from './use-home-tap';

// The main screen of a driver (G25): the nearest trips with their new requests, or «Qayerga
// ketyapsiz?» with the last route. «Safar eʼlon qilish» is the main button of the start flow;
// a driver on the check is not invited to publish yet (the note above says why).
export function DriverHome({ go }: { readonly go: HomeGo }) {
  const load = useDriverData();
  // A pull down at the top of the main screen refreshes the trips (docs/94 W1).
  return (
    <>
      <Screen onRefresh={load.refresh} />
      <Trips go={go} load={load} />
    </>
  );
}

type TripsProps = { readonly go: HomeGo; readonly load: DriverLoad };

function Trips({ go, load: { value, failed, reload } }: TripsProps) {
  const { t } = useI18n();
  const [places, retryPlaces] = useDirectory();
  const pending = usePending();
  const tap = useHomeTap();
  const retry = () => {
    if (failed) reload();
    if (places.status === 'error') retryPlaces();
  };
  if (failed) return <HomeFailed onRetry={retry} />;
  if (!value) return <HomeLoading lines={[false]} />;
  const [trips, requests] = value;
  const shown = nextTrips(trips, requests);
  const last = lastTrip(trips);
  if (shown.length === 0 && pending) return null;
  // The names of the places come from the directory: rows with places wait for it.
  if (shown.length > 0 || last) {
    if (places.status === 'error') return <HomeFailed onRetry={retry} />;
    if (places.status === 'loading') return <HomeLoading lines={shown.map(() => true)} />;
  }
  const directory = places.status === 'ready' ? places.directory : null;
  // Free seats after the time; new requests or a full car as a plate (the mockup of G53).
  const pill = ({ trip, requests: count }: DriverItem) => {
    if (count > 0) return { text: t('home.requests', { count: String(count) }), tone: 'attention' as const };
    if (trip.status === 'full') return { text: t('market.status.full'), tone: 'muted' as const };
    return undefined;
  };
  const withPill = (plate: ReturnType<typeof pill>) => (plate ? { pill: plate } : {});
  if (shown.length > 0 && directory)
    return (
      <HomeTrips
        rows={shown.map((item) => ({
          id: item.trip.id,
          from: item.trip.from,
          to: item.trip.to,
          departAt: item.trip.departAt,
          ...(item.trip.status === 'full'
            ? {}
            : { meta: t('market.trip.seats', { count: String(item.trip.seatsLeft) }) }),
          ...withPill(pill(item)),
        }))}
        directory={directory}
        onOpen={(id) => tap('item', () => go('my_trips', { link: { name: MY_TRIP_LINK, id } }))()}
      />
    );
  return (
    <AskTrip
      last={last}
      directory={directory}
      onLast={(launch) => tap('last_route', () => go('new_trip', launch))()}
    />
  );
}

type AskProps = {
  readonly last: Trip | null;
  readonly directory: PlaceDirectory | null;
  readonly onLast: (launch: Launch) => void;
};

// For a driver who drove before, the last trip again in one tap (G40 K3). Nothing else: the tile
// and the main button publish, as on the mockup of G53.
function AskTrip({ last, directory, onLast }: AskProps) {
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  const from = last && directory?.find(last.from);
  const to = last && directory?.find(last.to);
  if (!last || !from || !to) return null;
  return (
    <HomeRowCard
      icon="history"
      color={colors.brandStrong}
      title={t('common.route', { from: from.name, to: to.name })}
      hint={t('home.driver.last')}
      onClick={() => onLast({ route: { from, to }, again: againOf(last) })}
    />
  );
}
