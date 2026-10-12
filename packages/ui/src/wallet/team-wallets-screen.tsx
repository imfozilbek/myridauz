import type { AdminWallets } from '@platform/contracts';
import { useState } from 'react';
import { useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { ManageGroup, ManagePage, ManageRow } from '../manage/manage-page';
import { useLoad } from '../market/use-list';
import { EmptyState } from '../states/empty-state';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { haptic } from '../telegram/feedback';
import { DriverWallet } from './driver-wallet';

type Owner = AdminWallets['wallets'][number];

const found = (query: string) => (owner: Owner) => {
  const words = query.trim().toLocaleLowerCase('uz');
  return owner.firstName.toLocaleLowerCase('uz').includes(words) || owner.driverId.startsWith(words);
};

// "Hamyonlar" for the team (docs/12): every driver's balances; an owner corrects one by hand. A name
// or the id finds a driver among the loaded ones (G79 К5). The search on top, each wallet one row
// with its money on the right (G78 sheet 4).
export function TeamWalletsScreen({ onBack }: { readonly onBack: () => void }) {
  useScreenView('team.wallets');
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
  const all = [...value.wallets, ...(added?.wallets ?? [])];
  return (
    <ManagePage title={t('wallet.team.title')} onBack={onBack} onRefresh={refresh}>
      {all.length === 0 ? <EmptyState icon="wallet" title={t('wallet.team.empty')} /> : null}
      {all.length > 0 ? (
        <ManageGroup>
          <form className="manage-field" onSubmit={(event) => event.preventDefault()}>
            <input
              aria-label={t('manage.person.search')}
              placeholder={t('manage.person.search')}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </form>
        </ManageGroup>
      ) : null}
      {all.length > 0 ? (
        <ManageGroup>
          {all.filter(found(query)).map((owner) => (
            <ManageRow
              key={owner.driverId}
              icon="wallet"
              title={owner.firstName}
              hint={`${t('wallet.bonus')}: ${formatMoney(owner.bonus)}`}
              value={formatMoney(owner.main)}
              onClick={() => setOpen(owner)}
            />
          ))}
          {(added ? added.more : value.more) ? (
            <ManageRow icon="down" title={t('market.mine.more')} onClick={() => void loadMore()} />
          ) : null}
        </ManageGroup>
      ) : null}
    </ManagePage>
  );
}
