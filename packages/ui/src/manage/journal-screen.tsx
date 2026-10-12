import { tashkentDate, type Journal, type PersonId, personIdSchema } from '@platform/contracts';
import { useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { usePastDay } from '../market/when';
import { useLoad } from '../market/use-list';
import { EmptyState } from '../states/empty-state';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { entrySign, useEntryWords } from './journal-words';
import { ManageGroup, ManagePage, ManageRow } from './manage-page';
import { PeopleScreen } from './people-screen';

type Entry = Journal['entries'][number];

// The entries of one Tashkent day together, the newest day first, as they came.
function byDay(entries: readonly Entry[]): [string, Entry[]][] {
  const days = new Map<string, Entry[]>();
  for (const entry of entries) {
    const date = tashkentDate(entry.at);
    days.set(date, [...(days.get(date) ?? []), entry]);
  }
  return [...days];
}

// «Jurnal» of the owner (G75, gap К of docs/158, G78 sheet 5): every decision and change of the
// team by days, the newest first, each with its sign; a decision about a person opens the person.
// «Yana» shows the older ones.
export function JournalScreen({ onBack }: { readonly onBack: () => void }) {
  const { t, formatTime } = useI18n();
  const { team } = useApiClients();
  const { value, failed, reload } = useLoad(() => team.journal(), 'manage.journal');
  const [older, setOlder] = useState<readonly Entry[]>([]);
  const [end, setEnd] = useState(false);
  const [person, setPerson] = useState<PersonId | null>(null);
  const words = useEntryWords();
  const pastDay = usePastDay();
  if (person) return <PeopleScreen person={person} onBack={() => setPerson(null)} />;
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
  const now = Date.now();
  const row = (entry: Entry) => {
    const time = formatTime(new Date(entry.at));
    const subject = personIdSchema.safeParse(entry.subject);
    return (
      <ManageRow
        key={`${entry.at}-${entry.subject}-${entry.action}`}
        {...entrySign(entry)}
        title={words(entry)}
        hint={entry.member ? t('home.meta', { when: entry.member, more: time }) : time}
        {...(subject.success ? { onClick: () => setPerson(subject.data) } : {})}
      />
    );
  };
  return (
    <ManagePage title={t('manage.journal')} hint={t('manage.journalHint')} onBack={onBack}>
      {entries.length === 0 ? <EmptyState icon="history" title={t('manage.journalEmpty')} /> : null}
      {byDay(entries).map(([date, list]) => (
        <ManageGroup key={date} title={pastDay(date, now)}>
          {list.map(row)}
        </ManageGroup>
      ))}
      {entries.length > 0 && !end ? (
        <ManageGroup>
          <ManageRow icon="down" title={t('manage.journalMore')} onClick={() => void more()} />
        </ManageGroup>
      ) : null}
    </ManagePage>
  );
}
