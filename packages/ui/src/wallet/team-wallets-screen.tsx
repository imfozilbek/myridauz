import type { AdminWallets, Adjustment } from '@platform/contracts';
import { Title } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { CellValue } from '../account/cell-value';
import { Cell, List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { errorKey } from '../market/error-text';
import { useLoad } from '../market/use-list';
import { EmptyState } from '../states/empty-state';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { BackButton } from '../telegram/back-button';
import { haptic } from '../telegram/feedback';
import { useScreenBackground } from '../telegram/screen-background';
import { AdjustForm } from './adjust-form';
import { WalletView } from './wallet-view';
import '../market/market.css';

type Owner = AdminWallets['wallets'][number];

// "Hamyonlar" for the team (docs/12): every driver's balances; an owner corrects one by hand.
export function TeamWalletsScreen({ onBack }: { readonly onBack: () => void }) {
  useScreenView('team.wallets');
  useScreenBackground('grouped');
  const { t, formatMoney } = useI18n();
  const { wallet } = useApiClients();
  const { value, failed, reload } = useLoad(() => wallet.all());
  const [open, setOpen] = useState<Owner | null>(null);
  const close = () => {
    setOpen(null);
    reload();
  };
  if (open) return <DriverWallet owner={open} onBack={close} />;
  if (failed) return <ErrorScreen onRetry={reload} />;
  if (!value) return <ScreenSkeleton />;
  return (
    <div className="market">
      <BackButton onClick={onBack} />
      <Title weight="1" className="market-title">
        {t('wallet.team.title')}
      </Title>
      {value.length === 0 ? (
        <EmptyState icon="wallet" title={t('wallet.team.empty')} />
      ) : (
        <List>
          <Section>
            {value.map((owner) => (
              <Cell
                key={owner.driverId}
                onClick={() => setOpen(owner)}
                subtitle={`${t('wallet.bonus')}: ${formatMoney(owner.bonus)}`}
                after={<CellValue>{formatMoney(owner.main)}</CellValue>}
              >
                {owner.firstName}
              </Cell>
            ))}
          </Section>
        </List>
      )}
    </div>
  );
}

function DriverWallet({ owner, onBack }: { readonly owner: Owner; readonly onBack: () => void }) {
  const { t } = useI18n();
  const { wallet } = useApiClients();
  const { value, failed, reload } = useLoad(() => wallet.of(owner.driverId));
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
  if (adjusting)
    return <AdjustForm error={error} onBack={() => setAdjusting(false)} onSave={(a) => void save(a)} />;
  if (failed) return <ErrorScreen onRetry={reload} />;
  if (!value) return <ScreenSkeleton />;
  return (
    <div className="market">
      <BackButton onClick={onBack} />
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
