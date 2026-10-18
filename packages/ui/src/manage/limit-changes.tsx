import type { LimitKey, Limits } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { useLimitValue } from './limit-value';
import { ManageGroup, ManageRow } from './manage-page';

type Props = { readonly limitKey: LimitKey; readonly history: Limits['history'] };

// The changes of one limit under its sheet (G45, Q3 of docs/111): who, when, before and after.
export function LimitChanges({ limitKey, history }: Props) {
  const { t, formatDate } = useI18n();
  const valueOf = useLimitValue();
  const own = history.filter((change) => change.key === limitKey);
  if (own.length === 0) return null;
  return (
    <ManageGroup title={t('manage.limitHistory')}>
      {own.map((change) => (
        <ManageRow
          key={change.at}
          icon="history"
          title={t('manage.limitFromTo', {
            before: valueOf(limitKey, change.before),
            after: valueOf(limitKey, change.after),
          })}
          hint={t('pricing.versionBy', { date: formatDate(new Date(change.at)), who: change.by })}
        />
      ))}
    </ManageGroup>
  );
}
