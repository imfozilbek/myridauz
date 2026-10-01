import { BOOKING_LINK, type Point } from '@platform/contracts';
import { useEffect, useState } from 'react';
import { Cell, Section } from '../components';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import type { HomeGo } from '../flow/start-action';
import { IconTile } from '../icon-tile';
import { useLoad } from '../market/use-list';
import { useDirectory } from '../places/use-directory';
import { MainButton } from '../telegram/bottom-button';
import { knownPosition } from '../telegram/location';
import { useNameText } from '../way/way-end';
import { HomeFailed, HomeLoading } from './home-state';
import { HomeTrips } from './home-trips';
import { nextBookings } from './home-items';
import { useHomeTap } from './use-home-tap';

// The main screen of a passenger (G25): the nearest bookings, or «Qayerga borasiz?» with the start
// where the person stands; «Safar topish» is always the main button.
export function PassengerHome({ go }: { readonly go: HomeGo }) {
  const { t } = useI18n();
  const { bookings } = useApiClients();
  const { value, failed, reload } = useLoad(() => bookings.myBookings());
  const [state] = useDirectory();
  const tap = useHomeTap();
  const shown = value ? nextBookings(value) : null;
  return (
    <>
      {failed ? (
        <HomeFailed onRetry={reload} />
      ) : !shown || state.status !== 'ready' ? (
        <HomeLoading />
      ) : shown.items.length > 0 ? (
        <HomeTrips
          rows={shown.items.map((booking) => ({
            id: booking.id,
            from: booking.trip.from,
            to: booking.trip.to,
            departAt: booking.trip.departAt,
            detail: t(`bookings.status.${booking.status}`),
            done: booking.status === 'confirmed',
          }))}
          more={shown.more}
          directory={state.directory}
          onOpen={(id) => tap('item', () => go('my_trips', { link: { name: BOOKING_LINK, id } }))()}
          onAll={tap('all', () => go('my_trips'))}
        />
      ) : (
        <AskWay
          onFrom={tap('card', () => go('find_trip', { pick: 'from' }))}
          onTo={tap('card', () => go('find_trip', { pick: 'to' }))}
        />
      )}
      <MainButton text={t('common.passenger.findTrip')} onClick={tap('main_button', () => go('find_trip'))} />
    </>
  );
}

// «Qayerdan» filled by the place of the person when they allowed it before, «Qayerga borasiz?».
function AskWay({ onFrom, onTo }: { readonly onFrom: () => void; readonly onTo: () => void }) {
  const { t } = useI18n();
  const { map } = useApiClients();
  const nameText = useNameText();
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
    <Section header={t('common.passenger.findTrip')}>
      <Cell
        before={<IconTile name="origin" />}
        {...(here ? { subtitle: t('way.here') } : {})}
        onClick={onFrom}
      >
        {here ?? t('way.fromEmpty')}
      </Cell>
      <Cell before={<IconTile name="destination" tone="accent" />} onClick={onTo}>
        {t('way.toEmpty')}
      </Cell>
    </Section>
  );
}
