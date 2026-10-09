import { WALLET_SECTION } from '@platform/contracts';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { useDriver } from '../driver/driver-context';
import { HomeTile } from '../flow/home-tile';
import type { HomeGo } from '../flow/start-action';
import { useLoad } from '../market/use-list';
import { openInTelegram } from '../telegram/feedback';
import { useHomeTap } from './use-home-tap';

type Props = { readonly go: HomeGo; readonly openProfile: () => void };

// The last tiles of a driver (G66, mockup g66/2): «Hamyon» and «Profil» once the application is sent,
// «Yordam» lives in «Profil» (mockup g65/3). Before sending, «Yordam» alone (mockup g62/1 screen 1).
export function DriverTiles({ go, openProfile }: Props) {
  const { t } = useI18n();
  const status = useDriver()?.application.status;
  if (status === 'draft') return <SupportTile />;
  return (
    <>
      {status === 'approved' ? (
        <WalletTile onOpen={() => go(WALLET_SECTION)} />
      ) : (
        <BonusTile onOpen={() => go(WALLET_SECTION)} />
      )}
      <HomeTile
        icon="profile"
        tone="mint"
        title={t('account.profile.title')}
        hint={t('home.driver.profileHint')}
        onClick={openProfile}
      />
    </>
  );
}

// Fewer than 5 seats: the tile turns red and asks to top up, like the card of «Hamyon» (g65/1).
function WalletTile({ onOpen }: { readonly onOpen: () => void }) {
  const { t } = useI18n();
  const { wallet } = useApiClients();
  const tap = useHomeTap();
  const { fewSeats } = useBrand().wallet;
  const { value } = useLoad(() => wallet.mine(), 'wallet');
  const seats = value?.seatsLeft ?? null;
  const low = seats !== null && seats < fewSeats;
  const count = String(seats);
  return (
    <HomeTile
      icon="wallet"
      tone="mint"
      title={t('wallet.title')}
      hint={seats === null ? t('wallet.hint') : t(low ? 'home.wallet.low' : 'wallet.card.seats', { count })}
      alarm={low}
      onClick={tap('wallet', onOpen)}
    />
  );
}

// While the application is checked: the bonus that waits for the approval (docs/12, mockup g66/2).
function BonusTile({ onOpen }: { readonly onOpen: () => void }) {
  const { t, formatMoney } = useI18n();
  const { promo } = useBrand();
  const tap = useHomeTap();
  return (
    <HomeTile
      icon="wallet"
      tone="mint"
      title={t('wallet.title')}
      hint={t('home.wallet.bonus', { amount: formatMoney(promo.amount * promo.grants) })}
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
      tone="mint"
      title={t('home.support')}
      hint={t('home.supportHint')}
      onClick={tap('support', () => openInTelegram(`https://t.me/${bots.support}`))}
    />
  );
}
