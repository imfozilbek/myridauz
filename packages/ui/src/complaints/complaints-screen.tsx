import type { Complaint } from '@platform/contracts';
import { Title } from '@telegram-apps/telegram-ui';
import { useCallback, useEffect, useState } from 'react';
import { CellValue } from '../account/cell-value';
import { Cell, List, Section, Snackbar } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { useFeedChange } from '../feed/feed-context';
import { IconTile } from '../icon-tile';
import { EmptyState } from '../states/empty-state';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { useForgetOnLeave } from '../market/list-leave';
import { useKeepPlace } from '../screen/keep-place';
import { useListPlace } from '../screen/list-memory';
import { Screen } from '../screen/screen';
import { forgetLaunchParam, launchParam } from '../telegram/launch-param';
import { useScreenBackground } from '../telegram/screen-background';
import { ComplaintReview } from './complaint-review';
import '../market/market.css';

// "?complaint=<id>" from the admin bot's signal opens that complaint (docs/17).
const PARAM = 'complaint';
const COMPLAINT_ID = /^[A-Za-z0-9-]{1,64}$/u;
export const linkedComplaint = () => launchParam(PARAM, COMPLAINT_ID);
const QUEUE = 'complaints.queue';

// The open complaints, high priority first (docs/17).
export function ComplaintsScreen({ onBack }: { readonly onBack: () => void }) {
  useScreenView('complaints.queue');
  useScreenBackground('grouped');
  const { t } = useI18n();
  const { feedback } = useApiClients();
  const [queue, setQueue] = useState<Complaint[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState<string | null>(() => linkedComplaint());
  useForgetOnLeave(QUEUE);
  const load = useCallback(() => {
    setFailed(false);
    feedback.queue().then(setQueue, () => setFailed(true));
  }, [feedback]);
  useEffect(load, [load]);
  // Another moderator, a new complaint, a closed complaint or a pull down: the queue refreshes
  // quietly, the old one stays on the screen (docs/64, docs/94 F2).
  const refresh = useCallback(() => feedback.queue().then(setQueue, () => undefined), [feedback]);
  useFeedChange(() => void refresh());
  const close = () => {
    forgetLaunchParam(PARAM);
    setOpen(null);
    void refresh();
  };
  // The next complaint opens at once, as the applications do; the empty queue says so (docs/89 S9).
  const [told, setTold] = useState(false);
  const next = () => {
    forgetLaunchParam(PARAM);
    setTold(true);
    feedback.queue().then((fresh) => {
      setQueue(fresh);
      setOpen(fresh.find((complaint) => complaint.id !== open)?.id ?? null);
    }, close);
  };
  const notice = told ? <Snackbar onClose={() => setTold(false)}>{t('complaints.decided')}</Snackbar> : null;
  if (open)
    return (
      <>
        <ComplaintReview key={open} id={open} onBack={close} onDecided={next} />
        {notice}
      </>
    );
  if (failed) return <ErrorScreen onRetry={load} onBack={onBack} />;
  if (!queue) return <ScreenSkeleton onBack={onBack} />;
  return (
    <>
      <ComplaintsList queue={queue} onOpen={setOpen} onBack={onBack} onRefresh={refresh} />
      {notice}
    </>
  );
}

type ListProps = {
  readonly queue: readonly Complaint[];
  readonly onOpen: (id: string) => void;
  readonly onBack: () => void;
  readonly onRefresh: () => unknown;
};

// Back from a complaint the queue stands at the same place; a complaint decided by another
// moderator goes away without moving the row under the finger (docs/94 F2, S3).
function ComplaintsList({ queue, onOpen, onBack, onRefresh }: ListProps) {
  const { t, formatDate } = useI18n();
  useListPlace(QUEUE, true);
  useKeepPlace(queue);
  if (queue.length === 0)
    return (
      <>
        <Screen onBack={onBack} onRefresh={onRefresh} />
        <EmptyState icon="complaints" title={t('complaints.empty')} description={t('complaints.emptyHint')} />
      </>
    );
  return (
    <div className="market">
      <Screen onBack={onBack} onRefresh={onRefresh} />
      <Title weight="1" className="market-title">
        {t('complaints.queue')}
      </Title>
      <List>
        <Section>
          {queue.map((complaint) => (
            <Cell
              key={complaint.id}
              data-row={complaint.id}
              before={<IconTile name="complaints" tone={complaint.high ? 'accent' : 'brand'} />}
              subtitle={`${complaint.against.firstName} · ${formatDate(new Date(complaint.createdAt))}`}
              after={complaint.high ? <CellValue>{t('complaints.high')}</CellValue> : undefined}
              onClick={() => onOpen(complaint.id)}
            >
              {t(`complaints.reason.${complaint.reason}`)}
            </Cell>
          ))}
        </Section>
      </List>
    </div>
  );
}
