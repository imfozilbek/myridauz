import type { TranslationKey } from '@platform/i18n';
import type { PersonId } from '@platform/contracts';
import { useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { useTeamOwner } from '../team/use-owner';
import { useI18n } from '../context/i18n-context';
import { ManageGroup, ManageRow } from '../manage/manage-page';
import { errorKey } from '../market/error-text';
import { useLoad } from '../market/use-list';
import { ActionFailure } from '../states/action-failure';
import { confirm, haptic } from '../telegram/feedback';

// "Bloklar tarixi" of a person (docs/65 C): the block now, every block before it, who and why, a
// card of «Boshqaruv» (G78 sheet 6). The owner lifts a block here; a moderator sees why it is not allowed.
type Props = {
  readonly userId: PersonId;
  // The card above shows the block too: a lift reloads it (G91 ADM-6).
  readonly onChanged?: () => void;
};

export function BlockJournal({ userId, onChanged }: Props) {
  const { t, formatDate } = useI18n();
  const { moderation } = useApiClients();
  const { value, reload } = useLoad(() => moderation.blocks(userId));
  const [failure, setFailure] = useState<TranslationKey | null>(null);
  const owner = useTeamOwner();
  if (!value) return null;
  const unblock = async () => {
    if (!(await confirm(t('moderation.unblockAsk'), t('moderation.unblock')))) return;
    try {
      setFailure(null);
      await moderation.unblock(userId);
      haptic.success();
      if (onChanged) onChanged();
      else reload();
    } catch (caught) {
      haptic.error();
      setFailure(errorKey(caught));
    }
  };
  const { active } = value;
  const now = active
    ? active.until === null
      ? t('moderation.blocks.activeForever')
      : t('moderation.blocks.activeUntil', { date: formatDate(new Date(active.until)) })
    : value.entries.length > 0
      ? t('moderation.blocks.notNow')
      : t('moderation.blocks.none');
  return (
    <>
      <ManageGroup title={t('moderation.blocks.title')}>
        <ManageRow icon="blocked" title={now} danger={active !== null} />
        {value.entries.map((entry) => {
          const who = `${entry.by}, ${formatDate(new Date(entry.at))}`;
          // Until when stands in the line under the reason: on a narrow phone the reason is never
          // squeezed by a value on the right (docs/121, G45).
          const until =
            entry.until === null
              ? t('moderation.blocks.forever')
              : t('moderation.blocks.until', { date: formatDate(new Date(entry.until)) });
          return (
            <ManageRow
              key={entry.at}
              icon="blocked"
              title={t(`moderation.blocks.reason.${entry.reason}`)}
              hint={entry.reason === 'unblock' ? who : t('home.meta', { when: who, more: until })}
            />
          );
        })}
        {/* Lifting a block is the owner's (ownerOnly): a moderator reads the journal (G91 ADM-11). */}
        {active && owner ? (
          <ManageRow icon="blocked" title={t('moderation.unblock')} onClick={() => void unblock()} />
        ) : null}
      </ManageGroup>
      <ActionFailure error={failure} />
    </>
  );
}
