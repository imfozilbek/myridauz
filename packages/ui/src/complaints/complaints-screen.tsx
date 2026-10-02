import type { Complaint } from '@platform/contracts';
import { Title } from '@telegram-apps/telegram-ui';
import { useCallback, useEffect, useState } from 'react';
import { CellValue } from '../account/cell-value';
import { Cell, List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { useFeedChange } from '../feed/feed-context';
import { IconTile } from '../icon-tile';
import { EmptyState } from '../states/empty-state';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { Screen } from '../screen/screen';
import { forgetLaunchParam, launchParam } from '../telegram/launch-param';
import { useScreenBackground } from '../telegram/screen-background';
import { ComplaintReview } from './complaint-review';
import '../market/market.css';

// "?complaint=<id>" from the admin bot's signal opens that complaint (docs/17).
const PARAM = 'complaint';
const COMPLAINT_ID = /^[A-Za-z0-9-]{1,64}$/u;
export const linkedComplaint = () => launchParam(PARAM, COMPLAINT_ID);

// The open complaints, high priority first (docs/17).
export function ComplaintsScreen({ onBack }: { readonly onBack: () => void }) {
  useScreenView('complaints.queue');
  useScreenBackground('grouped');
  const { t, formatDate } = useI18n();
  const { feedback } = useApiClients();
  const [queue, setQueue] = useState<Complaint[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState<string | null>(() => linkedComplaint());
  const load = useCallback(() => {
    setFailed(false);
    feedback.queue().then(setQueue, () => setFailed(true));
  }, [feedback]);
  useEffect(load, [load]);
  // Another moderator or a new complaint: the queue refreshes quietly (docs/64).
  useFeedChange(() => void feedback.queue().then(setQueue, () => undefined));
  const close = () => {
    forgetLaunchParam(PARAM);
    setOpen(null);
    load();
  };
  if (open) return <ComplaintReview id={open} onBack={close} />;
  if (failed) return <ErrorScreen onRetry={load} onBack={onBack} />;
  if (!queue) return <ScreenSkeleton onBack={onBack} />;
  if (queue.length === 0)
    return (
      <>
        <Screen onBack={onBack} />
        <EmptyState icon="complaints" title={t('complaints.empty')} description={t('complaints.emptyHint')} />
      </>
    );
  return (
    <div className="market">
      <Screen onBack={onBack} />
      <Title weight="1" className="market-title">
        {t('complaints.queue')}
      </Title>
      <List>
        <Section>
          {queue.map((complaint) => (
            <Cell
              key={complaint.id}
              before={<IconTile name="complaints" tone={complaint.high ? 'accent' : 'brand'} />}
              subtitle={`${complaint.against.firstName} · ${formatDate(new Date(complaint.createdAt))}`}
              after={complaint.high ? <CellValue>{t('complaints.high')}</CellValue> : undefined}
              onClick={() => setOpen(complaint.id)}
            >
              {t(`complaints.reason.${complaint.reason}`)}
            </Cell>
          ))}
        </Section>
      </List>
    </div>
  );
}
