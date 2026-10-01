import type { TranslationKey } from '@platform/i18n';
import type { PersonId } from '@platform/contracts';
import { useState } from 'react';
import { Cell, Section } from '../components';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';
import { errorKey } from '../market/error-text';
import { useLoad } from '../market/use-list';
import { ActionFailure } from '../states/action-failure';
import { confirm, haptic } from '../telegram/feedback';

// "Bloklar tarixi" of a person (docs/65 C): the block now, every block before it, who and why.
// The owner lifts a block here; a moderator sees why it is not allowed.
export function BlockJournal({ userId }: { readonly userId: PersonId }) {
  const { t, formatDate } = useI18n();
  const { moderation } = useApiClients();
  const { value, reload } = useLoad(() => moderation.blocks(userId));
  const [failure, setFailure] = useState<TranslationKey | null>(null);
  if (!value) return null;
  const unblock = async () => {
    if (!(await confirm(t('moderation.unblockAsk'), t('moderation.unblock')))) return;
    try {
      setFailure(null);
      await moderation.unblock(userId);
      haptic.success();
      reload();
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
      <Section header={t('moderation.blocks.title')}>
        <Cell before={<IconTile name="blocked" tone={active ? 'accent' : 'brand'} />}>{now}</Cell>
        {value.entries.map((entry) => (
          <Cell
            key={entry.at}
            subtitle={`${entry.by}, ${formatDate(new Date(entry.at))}`}
            description={
              entry.reason === 'unblock'
                ? undefined
                : entry.until === null
                  ? t('moderation.blocks.forever')
                  : t('moderation.blocks.until', { date: formatDate(new Date(entry.until)) })
            }
          >
            {t(`moderation.blocks.reason.${entry.reason}`)}
          </Cell>
        ))}
        {active ? <Cell onClick={() => void unblock()}>{t('moderation.unblock')}</Cell> : null}
      </Section>
      <ActionFailure error={failure} />
    </>
  );
}
