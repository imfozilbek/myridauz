import type { AdminPitak, PitakDirection } from '@platform/contracts';
import { useState } from 'react';
import { useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { ManageGroup, ManagePage, ManageRow } from '../manage/manage-page';
import { useLoad } from '../market/use-list';
import { useDirectory } from '../places/use-directory';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { MainButton } from '../telegram/bottom-button';
import { DirectionPitak } from './direction-pitak';
import { PitakEdit } from './pitak-edit';
import { PitakHistory } from './pitak-history';

type Open =
  | { readonly kind: 'direction'; readonly direction: PitakDirection }
  | { readonly kind: 'pitak'; readonly pitak: AdminPitak | null }
  | { readonly kind: 'history' };

// "Pitaklar" for the team (G24, docs/72): the live directions with their main pitak, a missing one in
// red, the pitaks themselves and the history of changes at the end (G78 sheet 4).
export function PitaksScreen({ onBack }: { readonly onBack: () => void }) {
  useScreenView('pitaks');
  const { t } = useI18n();
  const { pitaks } = useApiClients();
  const { value, failed, reload, refresh } = useLoad(() => pitaks.all(), 'pitaks');
  const [directory, retry] = useDirectory();
  const [open, setOpen] = useState<Open | null>(null);
  if (failed || directory.status === 'error')
    return <ErrorScreen onRetry={() => (reload(), retry())} onBack={onBack} />;
  if (!value || directory.status !== 'ready') return <ScreenSkeleton onBack={onBack} />;
  const places = directory.directory;
  const regionName = (id: string) => places.find(id)?.name ?? id;
  const title = ({ from, to }: PitakDirection) =>
    t('common.route', { from: regionName(from), to: regionName(to) });
  const back = (changed: boolean) => {
    setOpen(null);
    if (changed) reload();
  };
  if (open?.kind === 'history')
    return <PitakHistory pitaks={value.pitaks} directory={places} onBack={() => setOpen(null)} />;
  if (open?.kind === 'direction')
    return (
      <DirectionPitak
        direction={open.direction}
        title={title(open.direction)}
        pitaks={value.pitaks.filter((pitak) => pitak.regionId === open.direction.from)}
        onBack={back}
      />
    );
  if (open?.kind === 'pitak') {
    const [first] = value.pitaks;
    const start = first?.point ?? { lat: places.regions[0]?.lat ?? 0, lng: places.regions[0]?.lng ?? 0 };
    return <PitakEdit pitak={open.pitak} start={start} directory={places} onBack={back} />;
  }
  const pitakName = (id: string | null) => value.pitaks.find((pitak) => pitak.id === id)?.name;
  return (
    <ManagePage title={t('pitaks.title')} onBack={onBack} onRefresh={refresh}>
      <ManageGroup title={t('pitaks.directions')}>
        {value.directions.map((direction) => {
          const name = pitakName(direction.pitakId);
          return (
            <ManageRow
              key={`${direction.from}>${direction.to}`}
              icon="trip"
              title={title(direction)}
              hint={name ?? t('pitaks.none')}
              alarm={name === undefined}
              onClick={() => setOpen({ kind: 'direction', direction })}
            />
          );
        })}
      </ManageGroup>
      <ManageGroup title={t('pitaks.all')}>
        {value.pitaks.map((pitak) => (
          <ManageRow
            key={pitak.id}
            icon="pickup"
            title={pitak.name}
            hint={t('home.meta', {
              when: regionName(pitak.regionId),
              more: t(`pitaks.status.${pitak.status}`),
            })}
            onClick={() => setOpen({ kind: 'pitak', pitak })}
          />
        ))}
      </ManageGroup>
      <ManageGroup>
        <ManageRow icon="history" title={t('pitaks.history')} onClick={() => setOpen({ kind: 'history' })} />
      </ManageGroup>
      <MainButton text={t('pitaks.add')} onClick={() => setOpen({ kind: 'pitak', pitak: null })} />
    </ManagePage>
  );
}
