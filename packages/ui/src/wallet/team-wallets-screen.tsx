import type { AdminWallets } from '@platform/contracts';
import { Button, Title } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { CellValue } from '../account/cell-value';
import { Cell, Field, List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { useLoad } from '../market/use-list';
import { EmptyState } from '../states/empty-state';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { Screen } from '../screen/screen';
import { haptic } from '../telegram/feedback';
import { useScreenBackground } from '../telegram/screen-background';
import { DriverWallet } from './driver-wallet';
import '../market/market.css';

type Owner = AdminWallets['wallets'][number];

const found = (query: string) => (owner: Owner) => {
  const words = query.trim().toLocaleLowerCase('uz');
  return owner.firstName.toLocaleLowerCase('uz').includes(words) || owner.driverId.startsWith(words);
};

// "Hamyonlar" for the team (docs/12): every driver's balances; an owner corrects one by hand. A name
// or the id finds a driver among the loaded ones (G79 К5).
export function TeamWalletsScreen({ onBack }: { readonly onBack: () => void }) {
  useScreenView('team.wallets');
  useScreenBackground();
  const { t, formatMoney } = useI18n();
  const { wallet } = useApiClients();
  const { value, failed, reload, refresh } = useLoad(() => wallet.all(0), 'team.wallets');
  const [open, setOpen] = useState<Owner | null>(null);
  const [query, setQuery] = useState('');
  // The next pages, 30 drivers each (G42): the first one stays with the quiet refresh.
  const [added, setAdded] = useState<{ wallets: Owner[]; more: boolean; page: number } | null>(null);
  const close = () => {
    setOpen(null);
    setAdded(null);
    reload();
  };
  const loadMore = async () => {
    const page = (added?.page ?? 0) + 1;
    try {
      const next = await wallet.all(page);
      setAdded({ wallets: [...(added?.wallets ?? []), ...next.wallets], more: next.more, page });
    } catch {
      haptic.error();
    }
  };
  if (open) return <DriverWallet owner={open} onBack={close} />;
  if (failed) return <ErrorScreen onRetry={reload} onBack={onBack} />;
  if (!value) return <ScreenSkeleton onBack={onBack} />;
  return (
    <div className="market">
      <Screen onBack={onBack} onRefresh={refresh} />
      <Title weight="1" className="market-title">
        {t('wallet.team.title')}
      </Title>
      {value.wallets.length === 0 ? (
        <EmptyState icon="wallet" title={t('wallet.team.empty')} />
      ) : (
        <List>
          <Field
            label={t('manage.person.search')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Section>
            {[...value.wallets, ...(added?.wallets ?? [])].filter(found(query)).map((owner) => (
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
          {(added ? added.more : value.more) ? (
            <div className="step-note">
              <Button mode="plain" size="m" stretched onClick={() => void loadMore()}>
                {t('market.mine.more')}
              </Button>
            </div>
          ) : null}
        </List>
      )}
    </div>
  );
}
