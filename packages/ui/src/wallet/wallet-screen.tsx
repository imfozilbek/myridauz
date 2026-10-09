import type { AppLink, WalletOperation } from '@platform/contracts';
import { useEffect, useState } from 'react';
import { TopUpScreen } from '../bookings/wallet-steps';
import { useAnalytics, useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { useLoad } from '../market/use-list';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { Screen } from '../screen/screen';
import { useScreenBackground } from '../telegram/screen-background';
import { brandVars } from '../theme/brand-vars';
import { WalletCard } from './wallet-card';
import { WalletDetailScreen } from './wallet-detail-screen';
import { WalletRows } from './wallet-rows';
import './wallet.css';

const CHEVRON = 10;
const PLUS = 18;

type Props = {
  readonly onBack: () => void;
  // «Safarni ochish» and the passenger of the details (mockup g65/2): where the app can open them.
  readonly onOpen?: ((link: AppLink) => void) | undefined;
};

// «Hamyon» of a driver (docs/12, G65, mockup g65/1): the card of the money, the rule of the
// commission, «Hisobni toʻldirish», then «Tarix»; a commission or a refund opens its details.
export function WalletScreen({ onBack, onOpen }: Props) {
  useScreenView('wallet');
  useScreenBackground();
  const { t } = useI18n();
  const { track } = useAnalytics();
  const { colors } = useBrand().theme;
  const { commission } = useBrand();
  const { wallet } = useApiClients();
  const { value, failed, reload, refresh } = useLoad(() => wallet.mine(), 'wallet');
  const [topUp, setTopUp] = useState(false);
  const [opened, setOpened] = useState<WalletOperation | null>(null);
  useEffect(() => {
    track({ name: 'wallet_open', screen: 'wallet' });
  }, [track]);
  if (topUp) return <TopUpScreen onBack={() => setTopUp(false)} />;
  if (opened) return <WalletDetailScreen operation={opened} onOpen={onOpen} onBack={() => setOpened(null)} />;
  if (failed) return <ErrorScreen onRetry={reload} onBack={onBack} />;
  if (!value) return <ScreenSkeleton onBack={onBack} />;
  return (
    <div className="wallet" style={brandVars(colors)}>
      <Screen onBack={onBack} onRefresh={refresh} />
      <h1 className="wallet-title">{t('wallet.title')}</h1>
      <WalletCard wallet={value} />
      <p className="wallet-note">{t('wallet.rule', { percent: String(commission.percent) })}</p>
      <button type="button" className="wallet-top-up" onClick={() => setTopUp(true)}>
        <span className="wallet-top-up-icon">
          <Icon name="more" size={PLUS} />
        </span>
        <b>{t('wallet.topUp')}</b>
        <Icon name="next" size={CHEVRON} />
      </button>
      <h2 className="wallet-head">{t('wallet.history')}</h2>
      <WalletRows operations={value.operations} onOpen={setOpened} />
    </div>
  );
}
