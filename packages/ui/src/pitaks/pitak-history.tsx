import type { AdminPitak, PitakChange } from '@platform/contracts';
import { Title } from '@telegram-apps/telegram-ui';
import { Cell, List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { useLoad } from '../market/use-list';
import type { PlaceDirectory } from '../places/directory';
import { EmptyState } from '../states/empty-state';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { BackButton } from '../telegram/back-button';

type Props = {
  readonly pitaks: readonly AdminPitak[];
  readonly directory: PlaceDirectory;
  readonly onBack: () => void;
};
type Saved = {
  readonly name?: string;
  readonly status?: AdminPitak['status'];
  readonly pitakId?: string | null;
};

// Every change of a pitak or a direction, the newest first (docs/72, as prices in docs/23).
export function PitakHistory({ pitaks, directory, onBack }: Props) {
  useScreenView('pitaks.history');
  const { t, formatDate, formatTime } = useI18n();
  const client = useApiClients().pitaks;
  const { value, failed, reload } = useLoad(() => client.history());
  if (failed) return <ErrorScreen onRetry={reload} onBack={onBack} />;
  if (!value) return <ScreenSkeleton onBack={onBack} />;
  const pitakName = (id: string | null | undefined) =>
    (id ? pitaks.find((pitak) => pitak.id === id)?.name : undefined) ?? t('pitaks.none');
  const regionName = (id: string) => directory.find(id)?.name ?? id;
  const subjectText = (subject: string) => {
    const [kind, rest = ''] = subject.split(':');
    if (kind === 'pitak') return pitakName(rest);
    const [from = '', to = ''] = rest.split('>');
    return t('common.route', { from: regionName(from), to: regionName(to) });
  };
  const stateText = ({ subject, before, after }: PitakChange) => {
    if (after === null) return t('pitaks.removed');
    const saved = JSON.parse(after) as Saved;
    const now = subject.startsWith('pitak:')
      ? `${saved.name ?? ''} · ${saved.status ? t(`pitaks.status.${saved.status}`) : ''}`
      : pitakName(saved.pitakId);
    return before === null ? `${t('pitaks.added')}: ${now}` : now;
  };
  const row = (change: PitakChange, index: number) => {
    const at = new Date(change.at);
    return (
      <Cell
        key={`${change.at}-${index}`}
        subtitle={`${formatDate(at)} ${formatTime(at)}`}
        description={stateText(change)}
      >
        {subjectText(change.subject)}
      </Cell>
    );
  };
  return (
    <div className="market">
      <BackButton onClick={onBack} />
      <Title weight="1" className="market-title">
        {t('pitaks.history')}
      </Title>
      <List>
        {value.length === 0 ? (
          <EmptyState icon="history" title={t('pitaks.historyEmpty')} />
        ) : (
          <Section>{value.map(row)}</Section>
        )}
      </List>
    </div>
  );
}
