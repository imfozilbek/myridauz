import type { Adjustment, PersonId } from '@platform/contracts';
import { Title } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { Cell, Section } from '../components';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { errorKey } from '../market/error-text';
import { useLoad } from '../market/use-list';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { Screen } from '../screen/screen';
import { haptic } from '../telegram/feedback';
import { AdjustForm } from './adjust-form';
import { WalletView } from './wallet-view';
import '../market/market.css';

type Props = {
  readonly owner: { readonly driverId: PersonId; readonly firstName: string };
  readonly onBack: () => void;
};

// The wallet of one driver for the owner (docs/12): its balances and history, a correction by hand.
// «Hamyonlar» and the card of the driver in «Odamlar» open it (G79 К5).
export function DriverWallet({ owner, onBack }: Props) {
  const { t } = useI18n();
  const { wallet } = useApiClients();
  const { value, failed, reload, refresh } = useLoad(() => wallet.of(owner.driverId));
  const [adjusting, setAdjusting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const adjust = () => {
    setError(null);
    setAdjusting(true);
  };
  const save = async (adjustment: Adjustment) => {
    try {
      await wallet.adjust(owner.driverId, adjustment);
      haptic.success();
      setAdjusting(false);
      reload();
    } catch (caught) {
      haptic.error();
      setError(t(errorKey(caught)));
    }
  };
  if (failed) return <ErrorScreen onRetry={reload} onBack={onBack} />;
  if (!value) return <ScreenSkeleton onBack={onBack} />;
  if (adjusting)
    return (
      <AdjustForm
        current={value}
        error={error}
        onBack={() => setAdjusting(false)}
        onSave={(a) => void save(a)}
      />
    );
  return (
    <div className="market">
      <Screen onBack={onBack} onRefresh={refresh} />
      <Title weight="1" className="market-title">
        {owner.firstName}
      </Title>
      <WalletView wallet={value}>
        <Section>
          <Cell onClick={adjust} subtitle={t('wallet.adjust.hint')}>
            {t('wallet.adjust.title')}
          </Cell>
        </Section>
      </WalletView>
    </div>
  );
}
