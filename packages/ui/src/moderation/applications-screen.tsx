import './moderation.css';
import type { ApplicationSummary } from '@platform/contracts';
import { useCallback, useEffect, useState } from 'react';
import { Snackbar } from '../components';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { useFeedChange } from '../feed/feed-context';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { useForgetOnLeave } from '../market/list-leave';
import { useScreenBackground } from '../telegram/screen-background';
import { ApplicationScreen, type Outcome } from './application-screen';
import { QUEUE, QueueView } from './queue-view';
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
