import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { useDriver } from '../driver/driver-context';
import { HomeTile } from '../flow/home-tile';
import type { HomeGo } from '../flow/start-action';
import { useLoad } from '../market/use-list';
import { openInTelegram } from '../telegram/feedback';
import { FEW_SEATS } from '../wallet/wallet-card';
import { WALLET_SECTION } from '../wallet/wallet-flow';
import { useHomeTap } from './use-home-tap';

// The last tile of a driver: «Yordam», the support bot, while the application is checked (G62,
// mockup g62/1 screens 1 and 4); after the approval «Hamyon» with the seats the money still
// confirms (docs/118 path 9, G65). «Yordam» of an approved driver lives in «Profil» (mockup g65/3).
export function DriverTiles({ go }: { readonly go: HomeGo }) {
  const driver = useDriver();
  return driver?.application.status === 'approved' ? (
    <WalletTile onOpen={() => go(WALLET_SECTION)} />
  ) : (
    <SupportTile />
  );
}

// Fewer than 5 seats: the tile turns red and asks to top up, like the card of «Hamyon» (g65/1).
function WalletTile({ onOpen }: { readonly onOpen: () => void }) {
  const { t } = useI18n();
  const { wallet } = useApiClients();
  const tap = useHomeTap();
  const { value } = useLoad(() => wallet.mine(), 'wallet');
  const seats = value?.seatsLeft ?? null;
  const low = seats !== null && seats < FEW_SEATS;
  const count = String(seats);
  return (
    <HomeTile
      icon="wallet"
      tone={low ? 'danger' : 'accent'}
      title={t('wallet.title')}
      hint={seats === null ? t('wallet.hint') : t(low ? 'wallet.card.low' : 'wallet.card.seats', { count })}
      onClick={tap('wallet', onOpen)}
    />
  );
}

function SupportTile() {
  const { t } = useI18n();
  const { bots } = useBrand();
  const tap = useHomeTap();
  return (
    <HomeTile
      icon="chat"
      tone="deep"
      title={t('home.support')}
      hint={t('home.supportHint')}
      onClick={tap('support', () => openInTelegram(`https://t.me/${bots.support}`))}
    />
  );
}
