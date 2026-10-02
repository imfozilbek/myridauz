import { BOOKING_LINK, type Booking } from '@platform/contracts';
import { useChevron } from '../chevron';
import { Cell, Section } from '../components';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import type { HomeGo } from '../flow/start-action';
import { IconTile } from '../icon-tile';
import { useLoad } from '../market/use-list';
import type { PlaceDirectory } from '../places/directory';
import { useDirectory } from '../places/use-directory';
import { useHere } from '../places/use-here';
import { Screen } from '../screen/screen';
import { HomeFailed, HomeLoading } from './home-state';
import { HomeTrips } from './home-trips';
import { nextBookings } from './home-items';
import { useHomeTap } from './use-home-tap';

// The main screen of a passenger (G25): the nearest bookings, or «Qayerga borasiz?» with the start
// where the person stands. «Safar topish» is the main button of the start flow.
export function PassengerHome({ go }: { readonly go: HomeGo }) {
  const { bookings } = useApiClients();
  const load = useLoad(() => bookings.myBookings());
  // A pull down at the top of the main screen refreshes the bookings (docs/94 W1).
  return (
    <>
      <Screen onRefresh={load.refresh} />
      <Bookings go={go} load={load} />
    </>
  );
}

type BookingsProps = {
  readonly go: HomeGo;
  readonly load: ReturnType<typeof useLoad<readonly Booking[]>>;
};

function Bookings({ go, load: { value, failed, reload } }: BookingsProps) {
  const { t } = useI18n();
  const [places, retryPlaces] = useDirectory();
  const tap = useHomeTap();
  const retry = () => {
    if (failed) reload();
    if (places.status === 'error') retryPlaces();
  };
  if (failed) return <HomeFailed onRetry={retry} />;
  if (!value) return <HomeLoading lines={[false, false]} />;
  const shown = nextBookings(value);
  if (shown.length === 0)
    return (
      <AskWay
        directory={places.status === 'ready' ? places.directory : null}
        onFrom={tap('card', () => go('find_trip', { pick: 'from' }))}
        onTo={tap('card', () => go('find_trip', { pick: 'to' }))}
      />
    );
  // The names of the places come from the directory: without it the rows cannot be read.
  if (places.status === 'error') return <HomeFailed onRetry={retry} />;
  if (places.status === 'loading') return <HomeLoading lines={shown.map(() => true)} />;
  return (
    <HomeTrips
      rows={shown.map((booking) => ({
        id: booking.id,
        from: booking.trip.from,
        to: booking.trip.to,
        departAt: booking.trip.departAt,
        detail: t(`bookings.status.${booking.status}`),
        done: booking.status === 'confirmed',
      }))}
      directory={places.directory}
      onOpen={(id) => tap('item', () => go('my_trips', { link: { name: BOOKING_LINK, id } }))()}
    />
  );
}

// «Qayerdan» filled by the district of the person when they allowed the place before, the same
// the search list shows after the tap (G26, docs/74); «Qayerga borasiz?».
type AskProps = {
  readonly directory: PlaceDirectory | null;
  readonly onFrom: () => void;
  readonly onTo: () => void;
};

function AskWay({ directory, onFrom, onTo }: AskProps) {
  const { t } = useI18n();
  const chevron = useChevron();
  const here = useHere(directory);
  return (
    <Section header={t('places.route')}>
      <Cell
        before={<IconTile name="origin" />}
        {...(here ? { subtitle: t('way.here') } : {})}
        after={chevron()}
        onClick={onFrom}
      >
        {here?.name ?? t('way.fromEmpty')}
      </Cell>
      <Cell before={<IconTile name="destination" tone="accent" />} after={chevron()} onClick={onTo}>
        {t('way.toEmpty')}
      </Cell>
    </Section>
  );
}
