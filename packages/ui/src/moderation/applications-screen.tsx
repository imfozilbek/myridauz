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
import { BackButton } from '../telegram/back-button';
import { useScreenBackground } from '../telegram/screen-background';
import { ApplicationScreen, type Outcome } from './application-screen';
import { forgetLinkedApplication, linkedApplication } from './linked-application';

// Applications waiting for the team, the oldest first (docs/04).
export function ApplicationsScreen({ onBack }: { readonly onBack: () => void }) {
  useScreenBackground('grouped');
  const { t } = useI18n();
  const { moderation } = useApiClients();
  const [queue, setQueue] = useState<ApplicationSummary[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState<ApplicationSummary | null>(null);
  const [told, setTold] = useState<Outcome | null>(null);
  const load = useCallback(() => {
    setFailed(false);
    moderation.queue().then(setQueue, () => setFailed(true));
  }, [moderation]);
  useEffect(load, [load]);
  // A new application or another moderator's decision: the queue refreshes quietly (docs/64).
  useFeedChange(() => void moderation.queue().then(setQueue, () => undefined));
  useEffect(() => {
    const linked = linkedApplication();
    if (linked === null) return;
    forgetLinkedApplication();
    moderation.get(linked).then(setOpen, () => undefined);
  }, [moderation]);
  const close = useCallback(() => {
    setOpen(null);
    load();
  }, [load]);
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
      <QueueView queue={queue} onOpen={setOpen} onBack={onBack} title={t('common.admin.applications')} />
      {notice}
    </>
  );
}

type QueueViewProps = {
  readonly queue: readonly ApplicationSummary[];
  readonly title: string;
  readonly onOpen: (application: ApplicationSummary) => void;
  readonly onBack: () => void;
};

function QueueView({ queue, title, onOpen, onBack }: QueueViewProps) {
  useScreenView('moderation.queue');
  const { t } = useI18n();
  if (queue.length === 0) {
    return (
      <>
        <BackButton onClick={onBack} />
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
      <BackButton onClick={onBack} />
      <Title weight="1" className="moderation-title">
        {title}
      </Title>
      <List>
        <Section>
          {queue.map((application) => (
            <Cell
              key={application.userId}
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
