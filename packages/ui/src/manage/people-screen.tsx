import { personIdSchema, type PersonId } from '@platform/contracts';
import { useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { useLoad } from '../market/use-list';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { ManageGroup, ManagePage } from './manage-page';
import { PersonView } from './person-view';

type PeopleProps = { readonly onBack: () => void; readonly person?: PersonId | undefined };

// «Odamlar» of the owner (G75, docs/120, G45): a person by the public id, or the one a sign of
// «Diqqat» names; the card, the blocks and their history.
export function PeopleScreen({ onBack, person }: PeopleProps) {
  const [open, setOpen] = useState<PersonId | null>(person ?? null);
  if (open) return <PersonLoad id={open} onBack={() => (person ? onBack() : setOpen(null))} />;
  return <PeopleSearch onBack={onBack} onOpen={setOpen} />;
}

function PeopleSearch({
  onBack,
  onOpen,
}: {
  readonly onBack: () => void;
  readonly onOpen: (id: PersonId) => void;
}) {
  const { t } = useI18n();
  const [text, setText] = useState('');
  const id = personIdSchema.safeParse(text.trim().toLowerCase());
  return (
    <ManagePage title={t('manage.people')} hint={t('manage.peopleHint')} onBack={onBack}>
      <ManageGroup title={t('manage.person.search')}>
        <form
          className="manage-field"
          onSubmit={(event) => {
            event.preventDefault();
            if (id.success) onOpen(id.data);
          }}
        >
          <input
            aria-label={t('manage.person.id')}
            placeholder={t('manage.person.id')}
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
          <button type="submit" disabled={!id.success}>
            {t('manage.person.open')}
          </button>
        </form>
      </ManageGroup>
    </ManagePage>
  );
}

function PersonLoad({ id, onBack }: { readonly id: PersonId; readonly onBack: () => void }) {
  const { team } = useApiClients();
  const { value, failed, reload } = useLoad(() => team.person(id));
  if (failed) return <ErrorScreen onRetry={reload} onBack={onBack} />;
  if (!value) return <ScreenSkeleton onBack={onBack} />;
  return <PersonView card={value} onBack={onBack} onChanged={reload} />;
}
