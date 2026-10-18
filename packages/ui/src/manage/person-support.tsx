import type { PersonId } from '@platform/contracts';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { useLoad } from '../market/use-list';
import { ManageGroup, ManageRow } from './manage-page';

// The newest messages of the talk with support shown on the card of «Odamlar».
const SHOWN = 5;

// The talk of a person with support under the card of «Odamlar» (G45, docs/111): the newest lines,
// who wrote each and when; the person or «Operator N», never the name of a member (docs/92).
export function PersonSupport({ id }: { readonly id: PersonId }) {
  const { t, formatDate } = useI18n();
  const { team } = useApiClients();
  const { value } = useLoad(() => team.support(id));
  if (!value) return null;
  const newest = value.talk.slice(-SHOWN).reverse();
  return (
    <ManageGroup title={t('manage.person.support')}>
      {newest.length === 0 ? <ManageRow icon="write" title={t('manage.person.supportNone')} /> : null}
      {newest.map((line) => (
        <ManageRow
          key={`${line.at}-${line.author}`}
          icon={line.author === 'team' ? 'team' : 'write'}
          title={line.kind === 'text' ? line.text : t(`navbat.support.${line.kind}`)}
          hint={t('home.meta', { when: line.name, more: formatDate(new Date(line.at)) })}
        />
      ))}
    </ManageGroup>
  );
}
