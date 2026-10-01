import { BOOKING_LINK, type Point } from '@platform/contracts';
import { useEffect, useState } from 'react';
import { useChevron } from '../chevron';
import { Cell, Section } from '../components';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import type { HomeGo } from '../flow/start-action';
import { IconTile } from '../icon-tile';
import { useLoad } from '../market/use-list';
import { useDirectory } from '../places/use-directory';
import { knownPosition } from '../telegram/location';
import { useNameText } from '../way/way-end';
import { HomeFailed, HomeLoading } from './home-state';
import { HomeTrips } from './home-trips';
import { nextBookings } from './home-items';
import { useHomeTap } from './use-home-tap';

// The main screen of a passenger (G25): the nearest bookings, or «Qayerga borasiz?» with the start
// where the person stands. «Safar topish» is the main button of the start flow.
export function PassengerHome({ go }: { readonly go: HomeGo }) {
  const { t } = useI18n();
  const { bookings } = useApiClients();
  const { value, failed, reload } = useLoad(() => bookings.myBookings());
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

// «Qayerdan» filled by the place of the person when they allowed it before, «Qayerga borasiz?».
function AskWay({ onFrom, onTo }: { readonly onFrom: () => void; readonly onTo: () => void }) {
  const { t } = useI18n();
  const { map } = useApiClients();
  const nameText = useNameText();
  const chevron = useChevron();
  const [here, setHere] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void knownPosition().then(async (point: Point | null) => {
      const where = point ? await map.where(point).catch(() => null) : null;
      if (active && where?.name) setHere(nameText(where.name, ''));
    });
    return () => void (active = false);
    // Asked once, when the main screen opens.
  }, []);
  return (
    <Section header={t('places.route')}>
      <Cell
        before={<IconTile name="origin" />}
        {...(here ? { subtitle: t('way.here') } : {})}
        after={chevron()}
        onClick={onFrom}
      >
        {here ?? t('way.fromEmpty')}
      </Cell>
      <Cell before={<IconTile name="destination" tone="accent" />} after={chevron()} onClick={onTo}>
        {t('way.toEmpty')}
      </Cell>
    </Section>
  );
}
