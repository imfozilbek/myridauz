import type { Journal } from '@platform/contracts';
import { useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { useLoad } from '../market/use-list';
import { EmptyState } from '../states/empty-state';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { ManageGroup, ManagePage, ManageRow } from './manage-page';
import { useEntryWords } from './journal-words';

type Entry = Journal['entries'][number];

// «Jurnal» of the owner (G75, gap К of docs/158): every decision and change of the team, the newest
// first; «Yana» shows the older ones.
export function JournalScreen({ onBack }: { readonly onBack: () => void }) {
  const { t, formatDate, formatTime } = useI18n();
  const { team } = useApiClients();
  const { value, failed, reload } = useLoad(() => team.journal(), 'manage.journal');
  const [older, setOlder] = useState<readonly Entry[]>([]);
  const [end, setEnd] = useState(false);
  const words = useEntryWords();
  if (failed) return <ErrorScreen onRetry={reload} onBack={onBack} />;
  if (!value) return <ScreenSkeleton onBack={onBack} />;
  const entries = [...value.entries, ...older];
  const more = async () => {
    const last = entries.at(-1);
    if (!last) return;
    const next = await team.journal(last.at);
    setOlder((list) => [...list, ...next.entries]);
    if (next.entries.length === 0) setEnd(true);
  };
  return (
    <ManagePage title={t('manage.journal')} hint={t('manage.journalHint')} onBack={onBack}>
      {entries.length === 0 ? (
        <EmptyState icon="history" title={t('manage.journalEmpty')} />
      ) : (
        <ManageGroup title={t('manage.journal')}>
          {entries.map((entry) => (
            <ManageRow
              key={`${entry.at}-${entry.subject}-${entry.action}`}
              icon="history"
              title={words(entry)}
              hint={`${entry.member} · ${formatDate(new Date(entry.at))} ${formatTime(new Date(entry.at))}`}
            />
          ))}
          {end ? null : <ManageRow icon="down" title={t('manage.journalMore')} onClick={() => void more()} />}
        </ManageGroup>
      )}
    </ManagePage>
  );
}
