import { LIMIT_KEYS, type LimitKey, type Limits } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { useLoad } from '../market/use-list';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { ManageGroup, ManagePage, ManageRow } from './manage-page';
import { LimitSheet } from './limit-sheet';
import { useLimitValue } from './limit-value';

// The groups of «Cheklovlar» by the first word of a key: money, trips, bookings, talk, ratings, team.
const GROUPS: readonly { readonly titleKey: TranslationKey; readonly of: readonly string[] }[] = [
  { titleKey: 'manage.group.money', of: ['commission', 'promo', 'wallet'] },
  { titleKey: 'manage.limitGroup.trips', of: ['schedule', 'bookings', 'requests'] },
  { titleKey: 'manage.limitGroup.people', of: ['chat', 'calls', 'shares', 'favorites', 'subscriptions'] },
  { titleKey: 'manage.limitGroup.ratings', of: ['ratings', 'complaints'] },
  { titleKey: 'manage.team', of: ['moderation'] },
];
const groupOf = (key: LimitKey) => key.split('.')[0] ?? '';

// «Cheklovlar» of the owner (G75, docs/128 §4): every limit of people with its value on the right; a
// tap opens the sheet of one limit over the list (G78 sheet 5). A change has its history and the
// server and every Mini App read it at once.
export function LimitsScreen({ onBack }: { readonly onBack: () => void }) {
  const { limits } = useApiClients();
  const { value, failed, reload } = useLoad(() => limits.state(), 'manage.limits');
  const [state, setState] = useState<Limits | null>(null);
  const [open, setOpen] = useState<LimitKey | null>(null);
  const shown = state ?? value;
  if (failed && !shown) return <ErrorScreen onRetry={reload} onBack={onBack} />;
  if (!shown) return <ScreenSkeleton onBack={onBack} />;
  const valueOf = (key: LimitKey | null) =>
    shown.limits.find((item) => item.key === key)?.value ?? Number.NaN;
  return (
    <>
      <LimitsList limits={shown} valueOf={valueOf} onBack={onBack} onOpen={setOpen} />
      <LimitSheet
        limitKey={open}
        value={valueOf(open)}
        onClose={() => setOpen(null)}
        onSaved={(next) => {
          setState(next);
          setOpen(null);
        }}
      />
    </>
  );
}

type ListProps = {
  readonly limits: Limits;
  readonly valueOf: (key: LimitKey) => number;
  readonly onBack: () => void;
  readonly onOpen: (key: LimitKey) => void;
};

function LimitsList({ limits, valueOf: value, onBack, onOpen }: ListProps) {
  const { t, formatDate } = useI18n();
  const valueOf = useLimitValue();
  return (
    <ManagePage title={t('manage.limits')} hint={t('manage.limitsHint')} onBack={onBack}>
      {GROUPS.map((group) => (
        <ManageGroup key={group.titleKey} title={t(group.titleKey)}>
          {LIMIT_KEYS.filter((key) => group.of.includes(groupOf(key))).map((key) => (
            <ManageRow
              key={key}
              icon="locked"
              title={t(`manage.limit.${key}`)}
              value={valueOf(key, value(key))}
              onClick={() => onOpen(key)}
            />
          ))}
        </ManageGroup>
      ))}
      {limits.history.length > 0 ? (
        <ManageGroup title={t('manage.limitHistory')}>
          {limits.history.map((change) => (
            <ManageRow
              key={`${change.key}-${change.at}`}
              icon="history"
              title={t(`manage.limit.${change.key}`)}
              hint={t('manage.limitChange', {
                before: valueOf(change.key, change.before),
                after: valueOf(change.key, change.after),
                by: change.by,
                date: formatDate(new Date(change.at)),
              })}
            />
          ))}
        </ManageGroup>
      ) : null}
    </ManagePage>
  );
}
