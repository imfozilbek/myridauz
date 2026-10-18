import { personIdSchema, type PersonId } from '@platform/contracts';
import { useEffect, useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { useLoad } from '../market/use-list';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import type { PersonName } from '../flow/start-action';
import { ManageGroup, ManagePage, ManageRow } from './manage-page';
import { forgetLinkedPerson } from './linked-person';
import { PersonView } from './person-view';

type PeopleProps = {
  readonly onBack: () => void;
  readonly person?: PersonId | undefined;
  // The people of a sign of «Diqqat»: a list on top, a tap opens one (G79 К3).
  readonly people?: readonly PersonName[] | undefined;
};

// «Odamlar» of the owner (G75, docs/120, G45): a person by the public id, or the one a sign of
// «Diqqat» names; the card, the blocks and their history.
export function PeopleScreen({ onBack, person, people = [] }: PeopleProps) {
  const [open, setOpen] = useState<PersonId | null>(person ?? null);
  useEffect(forgetLinkedPerson, []);
  if (open) return <PersonLoad id={open} onBack={() => (person ? onBack() : setOpen(null))} />;
  return <PeopleSearch people={people} onBack={onBack} onOpen={setOpen} />;
}

type SearchProps = {
  readonly people: readonly PersonName[];
  readonly onBack: () => void;
  readonly onOpen: (id: PersonId) => void;
};

function PeopleSearch({ people, onBack, onOpen }: SearchProps) {
  const { t } = useI18n();
  const [text, setText] = useState('');
  const id = personIdSchema.safeParse(text.trim().toLowerCase());
  return (
    <ManagePage title={t('manage.people')} hint={t('manage.peopleHint')} onBack={onBack}>
      {people.length > 0 ? (
        <ManageGroup title={t('team.section.diqqat')}>
          {people.map((one) => (
            <ManageRow
              key={one.id}
              icon="passengers"
              title={one.name}
              hint={one.id}
              onClick={() => onOpen(one.id)}
            />
          ))}
        </ManageGroup>
      ) : null}
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
