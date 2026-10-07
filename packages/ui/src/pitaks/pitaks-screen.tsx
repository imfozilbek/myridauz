import type { AdminPitak, PitakDirection } from '@platform/contracts';
import { Button, Title } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { Cell, List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';
import { useLoad } from '../market/use-list';
import { useDirectory } from '../places/use-directory';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { Screen } from '../screen/screen';
import { useScreenBackground } from '../telegram/screen-background';
import { DirectionPitak } from './direction-pitak';
import { PitakEdit } from './pitak-edit';
import { PitakHistory } from './pitak-history';
import '../market/market.css';

type Open =
  | { readonly kind: 'direction'; readonly direction: PitakDirection }
  | { readonly kind: 'pitak'; readonly pitak: AdminPitak | null }
  | { readonly kind: 'history' };

// "Pitaklar" for the team (G24, docs/72): the live directions with their main pitak, the pitaks
// themselves and the history of changes.
export function PitaksScreen({ onBack }: { readonly onBack: () => void }) {
  useScreenView('pitaks');
  useScreenBackground();
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
    <div className="market">
      <Screen onBack={onBack} onRefresh={refresh} />
      <Title weight="1" className="market-title">
        {t('pitaks.title')}
      </Title>
      <List>
        <Section>
          <Cell before={<IconTile name="history" />} onClick={() => setOpen({ kind: 'history' })}>
            {t('pitaks.history')}
          </Cell>
        </Section>
        <Section header={t('pitaks.directions')}>
          {value.directions.map((direction) => (
            <Cell
              key={`${direction.from}>${direction.to}`}
              subtitle={pitakName(direction.pitakId) ?? t('pitaks.none')}
              onClick={() => setOpen({ kind: 'direction', direction })}
            >
              {title(direction)}
            </Cell>
          ))}
        </Section>
        <Section header={t('pitaks.all')}>
          {value.pitaks.map((pitak) => (
            <Cell
              key={pitak.id}
              before={<IconTile name="pickup" tone={pitak.status === 'closed' ? 'deep' : 'brand'} />}
              subtitle={`${regionName(pitak.regionId)} · ${t(`pitaks.status.${pitak.status}`)}`}
              onClick={() => setOpen({ kind: 'pitak', pitak })}
            >
              {pitak.name}
            </Cell>
          ))}
        </Section>
        <div className="step-note">
          <Button size="l" stretched onClick={() => setOpen({ kind: 'pitak', pitak: null })}>
            {t('pitaks.add')}
          </Button>
        </div>
      </List>
    </div>
  );
}
