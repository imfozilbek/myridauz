import type { PersonId } from '@platform/contracts';
import { CellValue } from '../account/cell-value';
import { Cell, Section } from '../components';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';
import { useLoad } from '../market/use-list';

// What the team needs before deciding (docs/65 C): the same plate at another person and every
// earlier decision on this application. Nothing to say: nothing is shown.
export function ApplicationHistory({ userId }: { readonly userId: PersonId }) {
  const { t, formatDate } = useI18n();
  const { moderation } = useApiClients();
  const { value } = useLoad(() => moderation.get(userId));
  if (!value) return null;
  return (
    <>
      {value.samePlate > 0 ? (
        <Section>
          <Cell before={<IconTile name="error" tone="accent" />}>
            {t('moderation.samePlate', { count: String(value.samePlate) })}
          </Cell>
        </Section>
      ) : null}
      {value.history.length > 0 ? (
        <Section header={t('moderation.history.title')}>
          {value.history.map((entry) => (
            <Cell key={entry.at} after={<CellValue>{formatDate(new Date(entry.at))}</CellValue>}>
              {t(`moderation.history.${entry.status}`)}
            </Cell>
          ))}
        </Section>
      ) : null}
    </>
  );
}
