import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { usePending } from '../driver/driver-context';
import { HomeTile } from '../flow/home-tile';
import type { HomeGo } from '../flow/start-action';
import { useLoad } from '../market/use-list';
import { openInTelegram } from '../telegram/feedback';
import { useHomeTap } from './use-home-tap';

// The section of «Hamyon» the wallet tile opens (G53).
export const WALLET_SECTION = 'wallet';

// The last tile of a driver (owner decision 04.10.2026, G53): «Hamyon» with the bonus once the
// application is approved; before that «Yordam», the support bot, for the questions of the check.
export function DriverTiles({ go }: { readonly go: HomeGo }) {
  const pending = usePending();
  return pending ? <SupportTile /> : <WalletTile go={go} />;
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

function WalletTile({ go }: { readonly go: HomeGo }) {
  const { t, formatMoney } = useI18n();
  const { wallet } = useApiClients();
  const tap = useHomeTap();
  // The same memory as the screen of «Hamyon»: it opens with the numbers at once.
  const { value } = useLoad(() => wallet.mine(), 'wallet');
  const hint = !value
    ? t('wallet.title')
    : value.bonus > 0
      ? t('home.walletBonus', { amount: formatMoney(value.bonus) })
      : formatMoney(value.main);
  return (
    <HomeTile
      icon="wallet"
      tone="deep"
      title={t('wallet.title')}
      hint={hint}
      onClick={tap('wallet', () => go(WALLET_SECTION))}
    />
  );
}
