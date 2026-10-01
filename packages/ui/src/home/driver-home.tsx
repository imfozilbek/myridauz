import { MY_TRIP_LINK } from '@platform/contracts';
import { Cell, Section } from '../components';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { usePending } from '../driver/driver-context';
import type { HomeGo, Launch } from '../flow/start-action';
import { IconTile } from '../icon-tile';
import { useLoad } from '../market/use-list';
import type { PlaceDirectory } from '../places/directory';
import { useDirectory } from '../places/use-directory';
import { MainButton } from '../telegram/bottom-button';
import { HomeTrips } from './home-trips';
import { lastRoute, nextTrips } from './home-items';
import { useHomeTap } from './use-home-tap';

// The main screen of a driver (G25): the nearest trips with their new requests, or «Qayerga
// ketyapsiz?» with the last route; «Safar eʼlon qilish» is the main button once the driver is approved.
export function DriverHome({ go }: { readonly go: HomeGo }) {
  const { t } = useI18n();
  const { market, bookings } = useApiClients();
  const { value } = useLoad(() => Promise.all([market.myTrips(), bookings.driverBookings()]));
  const [state] = useDirectory();
  const pending = usePending();
  const tap = useHomeTap();
  if (!value || state.status !== 'ready') return null;
  const [trips, requests] = value;
  const shown = nextTrips(trips, requests);
  const rows = shown.items.map(({ trip, requests: count }) => ({
    id: trip.id,
    from: trip.from,
    to: trip.to,
    departAt: trip.departAt,
    detail: count > 0 ? t('home.requests', { count: String(count) }) : t(`market.status.${trip.status}`),
  }));
  return (
    <>
      {rows.length > 0 ? (
        <HomeTrips
          rows={rows}
          more={shown.more}
          directory={state.directory}
          onOpen={(id) => tap('item', () => go('my_trips', { link: { name: MY_TRIP_LINK, id } }))()}
          onAll={tap('all', () => go('my_trips'))}
        />
      ) : (
        <AskTrip
          last={lastRoute(trips)}
          directory={state.directory}
          onNew={tap('card', () => go('new_trip'))}
          onLast={(route) => tap('last_route', () => go('new_trip', { route }))()}
        />
      )}
      {pending ? null : (
        <MainButton text={t('home.publish')} onClick={tap('main_button', () => go('new_trip'))} />
      )}
    </>
  );
}

type Ids = { readonly from: string; readonly to: string };
type AskProps = {
  readonly last: Ids | null;
  readonly directory: PlaceDirectory;
  readonly onNew: () => void;
  readonly onLast: (route: NonNullable<Launch['route']>) => void;
};

// «Qayerga ketyapsiz?» and, for a driver who drove before, the last route ready in one tap.
function AskTrip({ last, directory, onNew, onLast }: AskProps) {
  const { t } = useI18n();
  const from = last ? directory.find(last.from) : undefined;
  const to = last ? directory.find(last.to) : undefined;
  return (
    <Section>
      <Cell before={<IconTile name="destination" tone="accent" />} onClick={onNew}>
        {t('home.driver.question')}
      </Cell>
      {from && to ? (
        <Cell
          before={<IconTile name="history" />}
          subtitle={t('home.driver.last')}
          onClick={() => onLast({ from, to })}
        >
          {`${from.name} → ${to.name}`}
        </Cell>
      ) : null}
    </Section>
  );
}
