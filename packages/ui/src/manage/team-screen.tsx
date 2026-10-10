import { personIdSchema, type TeamList } from '@platform/contracts';
import { useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { useLoad } from '../market/use-list';
import { ActionFailure } from '../states/action-failure';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { useFailure } from '../states/use-failure';
import { confirm, haptic } from '../telegram/feedback';
import { ManageGroup, ManagePage, ManageRow } from './manage-page';

type Member = TeamList['members'][number];

// «Jamoa» (G75, docs/120, docs/50): the owner adds a moderator by the public id of a registered
// person and removes one; the admin bot no longer does it.
export function TeamScreen({ onBack }: { readonly onBack: () => void }) {
  const { t } = useI18n();
  const { team } = useApiClients();
  const { value, failed, reload } = useLoad(() => team.members(), 'manage.team');
  const [text, setText] = useState('');
  const { failure, fail, clear } = useFailure();
  const id = personIdSchema.safeParse(text.trim().toLowerCase());
  if (failed) return <ErrorScreen onRetry={reload} onBack={onBack} />;
  if (!value) return <ScreenSkeleton onBack={onBack} />;
  const change = async (work: () => Promise<void>) => {
    clear();
    try {
      await work();
      haptic.success();
      setText('');
      reload();
    } catch (caught) {
      fail(caught);
    }
  };
  const remove = async (member: Member) => {
    if (await confirm(t('manage.teamRemoveAsk', { name: member.firstName }), t('manage.teamRemove')))
      await change(() => team.remove(member.id));
  };
  return (
    <ManagePage title={t('manage.team')} onBack={onBack}>
      <ManageGroup title={t('manage.team')}>
        {value.members.map((member) => (
          <ManageRow
            key={member.id}
            icon={member.role === 'owner' ? 'approved' : 'passengers'}
            title={member.firstName}
            hint={t(`home.role.${member.role}`)}
            {...(member.role === 'moderator' ? { onClick: () => void remove(member) } : {})}
          />
        ))}
      </ManageGroup>
      <ManageGroup title={t('manage.teamAdd')}>
        <form
          className="manage-field"
          onSubmit={(event) => {
            event.preventDefault();
            if (id.success) void change(() => team.add(id.data));
          }}
        >
          <input
            aria-label={t('manage.person.id')}
            placeholder={t('manage.person.id')}
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
          <button type="submit" disabled={!id.success}>
            {t('manage.teamAddButton')}
          </button>
        </form>
      </ManageGroup>
      <ActionFailure error={failure} />
    </ManagePage>
  );
}
