import { WALLET_SECTION, type Booking, type Wallet } from '@platform/contracts';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { useDriver } from '../driver/driver-context';
import { HomeTile } from '../flow/home-tile';
import type { HomeGo } from '../flow/start-action';
import { useLoad } from '../market/use-list';
import { useDriverData } from './driver-data';
import { nextTrip } from './driver-day';
import { waitingRequests } from './home-items';
import { CHATS_SECTION, ChatsTile, SupportTile, TripsTile } from './shared-tiles';
import { driverTripsHint } from './tile-hints';
import { useHomeTap } from './use-home-tap';
import { useNow } from '../own-trip/use-now';

// The four tiles of a driver (G76, docs/165, mockup g76/3): «Mening safarlarim», «Suhbatlar»,
// «Hamyon», «Yordam»; the profile and the car are the head on top.
export function DriverTiles({ go }: { readonly go: HomeGo }) {
  const { value } = useDriverData();
  const now = useNow();
  const [trips, bookings] = value ?? [[], []];
  // The requests of the trips other than the one in the block at the bottom.
  const shown = nextTrip(trips, now);
  const badge = trips
    .filter((trip) => trip !== shown && trip.departAt > now)
    .reduce((sum, trip) => sum + waitingRequests(trip, bookings), 0);
  return (
    <>
      <TripsTile
        hint={driverTripsHint(trips, bookings, now)}
        badge={badge}
        now={now}
        onOpen={() => go('my_trips')}
      />
      <ChatsTile driver onOpen={() => go(CHATS_SECTION)} />
      <WalletTile asked={bookings} onOpen={() => go(WALLET_SECTION)} />
      <SupportTile />
    </>
  );
}

// «Hamyon»: for how many seats it pays; amber when few, red with «!» when a waiting request cannot
// be confirmed (mockup g76/3 states 8 and 10). Before the approval, the bonus that waits for it.
function WalletTile({ asked, onOpen }: { readonly asked: readonly Booking[]; readonly onOpen: () => void }) {
  const { t, formatMoney } = useI18n();
  const { wallet } = useApiClients();
  const { fewSeats } = useBrand().wallet;
  const tap = useHomeTap();
  const approved = useDriver()?.application.status === 'approved';
  const { value } = useLoad(() => wallet.mine(), 'wallet');
  const missing = value ? shortOf(value, asked) : 0;
  const seats = value?.seatsLeft ?? null;
  const low = seats !== null && seats < fewSeats;
  const count = String(seats);
  const hint = !approved
    ? t('home.wallet.afterApproval')
    : missing > 0
      ? t('home.wallet.short', { amount: formatMoney(missing) })
      : seats === null
        ? t('wallet.hint')
        : t(low ? 'home.wallet.low' : 'wallet.card.seats', { count });
  return (
    <HomeTile
      square
      icon="wallet"
      tone="brand"
      title={t('wallet.title')}
      hint={hint}
      alarm={approved && missing > 0}
      soon={approved && missing === 0 && low}
      onClick={tap('wallet', onOpen)}
    />
  );
}

// What the wallet lacks for the first waiting request (docs/12): its commission less the money.
function shortOf(wallet: Wallet, bookings: readonly Booking[]): number {
  const [first] = bookings.filter((booking) => booking.status === 'requested');
  return first ? Math.max(0, first.commission - wallet.bonus - wallet.main) : 0;
}
