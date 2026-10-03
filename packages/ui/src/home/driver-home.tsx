import { MY_TRIP_LINK, type Booking, type Trip } from '@platform/contracts';
import { useChevron } from '../chevron';
import { Cell, Section } from '../components';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { usePending } from '../driver/driver-context';
import type { HomeGo, Launch } from '../flow/start-action';
import { IconTile } from '../icon-tile';
import { useLoad } from '../market/use-list';
import type { PlaceDirectory } from '../places/directory';
import { useDirectory } from '../places/use-directory';
import { Screen } from '../screen/screen';
import { HomeFailed, HomeLoading } from './home-state';
import { HomeTrips } from './home-trips';
import { againOf, lastTrip, nextTrips, type DriverItem } from './home-items';
import { useHomeTap } from './use-home-tap';

// The main screen of a driver (G25): the nearest trips with their new requests, or «Qayerga
// ketyapsiz?» with the last route. «Safar eʼlon qilish» is the main button of the start flow;
// a driver on the check is not invited to publish yet (the note above says why).
export function DriverHome({ go }: { readonly go: HomeGo }) {
  const { market, bookings } = useApiClients();
  const load = useLoad(() => Promise.all([market.myTrips(), bookings.driverBookings()]));
  // A pull down at the top of the main screen refreshes the trips (docs/94 W1).
  return (
    <>
      <Screen onRefresh={load.refresh} />
      <Trips go={go} load={load} />
    </>
  );
}

type TripsProps = {
  readonly go: HomeGo;
  readonly load: ReturnType<typeof useLoad<[Trip[], Booking[]]>>;
};

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
  const detail = ({ trip, requests: count }: DriverItem) => {
    if (count > 0) return t('home.requests', { count: String(count) });
    if (trip.status === 'full') return t('market.status.full');
    return t('market.trip.seats', { count: String(trip.seatsLeft) });
  };
  if (shown.length > 0 && directory)
    return (
      <HomeTrips
        rows={shown.map((item) => ({
          id: item.trip.id,
          from: item.trip.from,
          to: item.trip.to,
          departAt: item.trip.departAt,
          detail: detail(item),
          done: item.trip.status === 'full',
          count: item.requests,
        }))}
        directory={directory}
        onOpen={(id) => tap('item', () => go('my_trips', { link: { name: MY_TRIP_LINK, id } }))()}
      />
    );
  return (
    <AskTrip
      last={last}
      directory={directory}
      onNew={tap('card', () => go('new_trip', { pick: 'to' }))}
      onLast={(launch) => tap('last_route', () => go('new_trip', launch))()}
    />
  );
}

type AskProps = {
  readonly last: Trip | null;
  readonly directory: PlaceDirectory | null;
  readonly onNew: () => void;
  readonly onLast: (launch: Launch) => void;
};

// «Qayerga ketyapsiz?» opens the list of the end; for a driver who drove before, the last trip again.
function AskTrip({ last, directory, onNew, onLast }: AskProps) {
  const { t } = useI18n();
  const chevron = useChevron();
  const from = last && directory?.find(last.from);
  const to = last && directory?.find(last.to);
  return (
    <Section header={t('places.route')}>
      <Cell before={<IconTile name="destination" tone="accent" />} after={chevron()} onClick={onNew}>
        {t('home.driver.question')}
      </Cell>
      {last && from && to ? (
        <Cell
          before={<IconTile name="history" />}
          subtitle={t('home.driver.last')}
          after={chevron()}
          onClick={() => onLast({ route: { from, to }, again: againOf(last) })}
        >
          {t('common.route', { from: from.name, to: to.name })}
        </Cell>
      ) : null}
    </Section>
  );
}
