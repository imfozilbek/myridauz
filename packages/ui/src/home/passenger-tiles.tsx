import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { HomeTile } from '../flow/home-tile';
import type { HomeGo } from '../flow/start-action';
import { useLoad } from '../market/use-list';
import { useWhen } from './home-when';
import { nextBookings } from './home-items';
import { usePassengerData } from './passenger-data';
import { CHATS_SECTION, ChatsTile, SupportTile, TripsTile } from './shared-tiles';
import { passengerTripsHint } from './tile-hints';
import { useHomeTap } from './use-home-tap';
import { useNow } from '../own-trip/use-now';

export const FAVORITES_SECTION = 'favorites';

// The four tiles of a passenger (G76, docs/165, mockup g76/2): «Mening safarlarim», «Suhbatlar»,
// «Sevimli haydovchilar», «Yordam»; the profile is the head on top.
export function PassengerTiles({ go }: { readonly go: HomeGo }) {
  const { value } = usePassengerData();
  const now = useNow();
  const [bookings, requests, offers] = value ?? [[], [], []];
  // The seats and requests live now: one of them is in the block at the bottom.
  const live =
    nextBookings(bookings, Infinity).length + requests.filter((one) => one.status === 'open').length;
  return (
    <>
      <TripsTile
        hint={passengerTripsHint(bookings, requests, offers)}
        badge={Math.max(0, live - 1)}
        now={now}
        onOpen={() => go('my_trips')}
      />
      <ChatsTile driver={false} onOpen={() => go(CHATS_SECTION)} />
      <FavoritesTile now={now} onOpen={() => go(FAVORITES_SECTION)} />
      <SupportTile />
    </>
  );
}

// The saved drivers: the trip of one of them when there is one, else how many; none yet, what
// comes here (mockup g76/2 states 1 and 3).
function FavoritesTile({ now, onOpen }: { readonly now: number; readonly onOpen: () => void }) {
  const { t } = useI18n();
  const { comfort } = useApiClients();
  const tap = useHomeTap();
  const when = useWhen(now);
  const { value } = useLoad(() => comfort.favorites(), 'favorites');
  const [trip] = value?.trips.filter((one) => one.seatsLeft > 0 && one.departAt > now) ?? [];
  const count = value?.drivers.length ?? 0;
  const hint = trip
    ? t('home.favorites.trip', {
        name: trip.driver.firstName,
        when: when(trip.departAt).toLocaleLowerCase('uz'),
      })
    : count > 0
      ? t('home.favorites.count', { count: String(count) })
      : t('home.favorites.none');
  return (
    <HomeTile
      square
      icon="favorite"
      tone="brand"
      title={t('comfort.favorites.title')}
      hint={hint}
      onClick={tap('favorites', onOpen)}
    />
  );
}
