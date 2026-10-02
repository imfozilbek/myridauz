import './moderation.css';
import { formatPlate, type ApplicationSummary } from '@platform/contracts';
import { Title } from '@telegram-apps/telegram-ui';
import { useCallback, useEffect, useState } from 'react';
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
import { useScreenBackground } from '../telegram/screen-background';
import { ApplicationScreen, type Outcome } from './application-screen';
import { forgetLinkedApplication, linkedApplication } from './linked-application';

const QUEUE = 'moderation.queue';

// Applications waiting for the team, the oldest first (docs/04).
export function ApplicationsScreen({ onBack }: { readonly onBack: () => void }) {
  useScreenBackground('grouped');
  const { t } = useI18n();
  const { moderation } = useApiClients();
  const [queue, setQueue] = useState<ApplicationSummary[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState<ApplicationSummary | null>(null);
  const [told, setTold] = useState<Outcome | null>(null);
  useForgetOnLeave(QUEUE);
  const load = useCallback(() => {
    setFailed(false);
    moderation.queue().then(setQueue, () => setFailed(true));
  }, [moderation]);
  useEffect(load, [load]);
  // A new application, another moderator's decision, a closed application or a pull down: the queue
  // refreshes quietly, the old one stays on the screen (docs/64, docs/94 F2).
  const refresh = useCallback(() => moderation.queue().then(setQueue, () => undefined), [moderation]);
  useFeedChange(() => void refresh());
  useEffect(() => {
    const linked = linkedApplication();
    if (linked === null) return;
    forgetLinkedApplication();
    moderation.get(linked).then(setOpen, () => undefined);
  }, [moderation]);
  const close = useCallback(() => {
    setOpen(null);
    void refresh();
  }, [refresh]);
  // The next application opens at once; the empty queue says so (docs/89 S9).
  const next = useCallback(
    (outcome: Outcome) => {
      const done = open?.userId;
      setTold(outcome);
      moderation.queue().then(
        (fresh) => {
          setQueue(fresh);
          setOpen(fresh.find((application) => application.userId !== done) ?? null);
        },
        () => close(),
      );
    },
    [moderation, open, close],
  );
  const notice = told ? <Snackbar onClose={() => setTold(null)}>{t(`moderation.${told}`)}</Snackbar> : null;

  if (open)
    return (
      <>
        <ApplicationScreen key={open.userId} application={open} onBack={close} onDone={next} />
        {notice}
      </>
    );
  if (failed) return <ErrorScreen onRetry={load} onBack={onBack} />;
  if (!queue) return <ScreenSkeleton onBack={onBack} />;
  return (
    <>
      <QueueView
        queue={queue}
        onOpen={setOpen}
        onBack={onBack}
        onRefresh={refresh}
        title={t('common.admin.applications')}
      />
      {notice}
    </>
  );
}

type QueueViewProps = {
  readonly queue: readonly ApplicationSummary[];
  readonly title: string;
  readonly onOpen: (application: ApplicationSummary) => void;
  readonly onBack: () => void;
  readonly onRefresh: () => unknown;
};

// Back from an application the queue stands at the same place; an application decided by another
// moderator goes away without moving the row under the finger (docs/94 F2, S3).
function QueueView({ queue, title, onOpen, onBack, onRefresh }: QueueViewProps) {
  useScreenView('moderation.queue');
  const { t } = useI18n();
  useListPlace(QUEUE, true);
  useKeepPlace(queue);
  if (queue.length === 0) {
    return (
      <>
        <Screen onBack={onBack} onRefresh={onRefresh} />
        <EmptyState
          icon="applications"
          title={t('moderation.queue.empty')}
          description={t('moderation.queue.emptyHint')}
        />
      </>
    );
  }
  return (
    <div className="moderation">
      <Screen onBack={onBack} onRefresh={onRefresh} />
      <Title weight="1" className="moderation-title">
        {title}
      </Title>
      <List>
        <Section>
          {queue.map((application) => (
            <Cell
              key={application.userId}
              data-row={application.userId}
              before={<IconTile name="car" />}
              subtitle={`${application.car.make} ${application.car.model} · ${formatPlate(application.car.plate)}`}
              onClick={() => onOpen(application)}
            >
              {application.firstName}
            </Cell>
          ))}
        </Section>
      </List>
    </div>
  );
}
