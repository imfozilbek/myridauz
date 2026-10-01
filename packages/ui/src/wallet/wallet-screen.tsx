import { Title } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';
import { TopUpScreen } from '../bookings/wallet-steps';
import { Cell, Section } from '../components';
import { useAnalytics, useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';
import { useLoad } from '../market/use-list';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { BackButton } from '../telegram/back-button';
import { useScreenBackground } from '../telegram/screen-background';
import { WalletView } from './wallet-view';
import '../market/market.css';

// "Hamyon" of a driver (docs/12): the bonus and its end, the main balance, the history.
export function WalletScreen({ onBack }: { readonly onBack: () => void }) {
  useScreenView('wallet');
  useScreenBackground('grouped');
  const { t } = useI18n();
  const { track } = useAnalytics();
  const { wallet } = useApiClients();
  const { value, failed, reload } = useLoad(() => wallet.mine());
  const [topUp, setTopUp] = useState(false);
  useEffect(() => track({ name: 'wallet_open', screen: 'wallet' }), [track]);
  if (topUp) return <TopUpScreen onBack={() => setTopUp(false)} />;
  if (failed) return <ErrorScreen onRetry={reload} onBack={onBack} />;
  if (!value) return <ScreenSkeleton onBack={onBack} />;
  return (
    <div className="market">
      <BackButton onClick={onBack} />
      <Title weight="1" className="market-title">
        {t('wallet.title')}
      </Title>
      <WalletView wallet={value} rule={t('wallet.rule')}>
        <Section>
          <Cell before={<IconTile name="wallet" />} onClick={() => setTopUp(true)}>
            {t('wallet.topUp')}
          </Cell>
        </Section>
      </WalletView>
    </div>
  );
}
