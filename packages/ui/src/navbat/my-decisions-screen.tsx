import { formatPlate, MY_DECISIONS_DAYS, type MyDecision, type PersonId } from '@platform/contracts';
import { useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { byDay } from '../manage/by-day';
import { ManageGroup, ManagePage, ManageRow, type RowTone } from '../manage/manage-page';
import { useLoad } from '../market/use-list';
import { usePastDay } from '../market/when';
import { EmptyState } from '../states/empty-state';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { DecidedCase } from './decided-case';

// Green for a driver let on, red for one stopped, gray for a fix asked (G78 sheet 5).
const TONE: Readonly<Record<MyDecision['status'], RowTone | undefined>> = {
  approved: 'success',
  rejected: 'danger',
  changes_requested: undefined,
};

// «Mening qarorlarim» (G95, docs/224): the decisions of this member about driver applications for 7
// days, by days, the newest first; a row opens the application to fix the decision. No time on the
// right: the decision and the plate in one line keep every row one height (docs/121).
export function MyDecisionsScreen({ onBack }: { readonly onBack: () => void }) {
  const { t } = useI18n();
  const { moderation } = useApiClients();
  const { value, failed, reload } = useLoad(() => moderation.myDecisions(), 'moderation.mine');
  const [open, setOpen] = useState<PersonId | null>(null);
  const pastDay = usePastDay();
  const close = () => {
    setOpen(null);
    reload();
  };
  if (open) return <DecidedCase id={open} onBack={close} />;
  if (failed) return <ErrorScreen onRetry={reload} onBack={onBack} />;
  if (!value) return <ScreenSkeleton onBack={onBack} />;
  const days = MY_DECISIONS_DAYS;
  const now = Date.now();
  const row = (decision: MyDecision) => {
    const tone = TONE[decision.status];
    return (
      <ManageRow
        key={`${decision.userId}-${decision.at}`}
        icon="applications"
        {...(tone ? { tone } : {})}
        title={decision.firstName}
        hint={t('home.meta', {
          when: t(`moderation.history.${decision.status}`),
          more: formatPlate(decision.plate),
        })}
        onClick={() => setOpen(decision.userId)}
      />
    );
  };
  return (
    <ManagePage title={t('moderation.mine.title')} hint={t('moderation.mine.hint', { days })} onBack={onBack}>
      {value.length === 0 ? <EmptyState icon="history" title={t('moderation.mine.empty', { days })} /> : null}
      {byDay(value).map(([date, list]) => (
        <ManageGroup key={date} title={pastDay(date, now)}>
          {list.map(row)}
        </ManageGroup>
      ))}
    </ManagePage>
  );
}
