import { ENTRIES, type Entries, type Entry } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import type { IconName } from '../icons';
import { ManageGroup, ManageRow } from '../manage/manage-page';

const ICONS: Readonly<Record<Entry, IconName>> = { bot: 'send', direct: 'homeScreen', link: 'share' };

// «Ilovaga kirishlar» (G87 V4, docs/116): how the sessions of the period began, a button of a bot
// message, a direct visit or a link; one session counts once.
export function EntriesSection({ entries }: { readonly entries: Entries }) {
  const { t, formatNumber } = useI18n();
  return (
    <ManageGroup title={t('stats.entries.title')}>
      {ENTRIES.map((entry) => (
        <ManageRow
          key={entry}
          icon={ICONS[entry]}
          title={t(`stats.entries.${entry}`)}
          value={formatNumber(entries[entry])}
        />
      ))}
    </ManageGroup>
  );
}
