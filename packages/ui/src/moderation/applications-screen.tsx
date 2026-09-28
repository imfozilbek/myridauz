import './moderation.css';
import { formatPlate, type ApplicationSummary } from '@platform/contracts';
import { Title } from '@telegram-apps/telegram-ui';
import { useCallback, useEffect, useState } from 'react';
import { Cell, List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';
import { EmptyState } from '../states/empty-state';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { BackButton } from '../telegram/back-button';
import { useScreenBackground } from '../telegram/screen-background';
import { ApplicationScreen } from './application-screen';

// Applications waiting for the team, the oldest first (docs/04).
export function ApplicationsScreen({ onBack }: { readonly onBack: () => void }) {
  useScreenBackground('grouped');
  const { t } = useI18n();
  const { moderation } = useApiClients();
  const [queue, setQueue] = useState<ApplicationSummary[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState<ApplicationSummary | null>(null);
  const load = useCallback(() => {
    setFailed(false);
    moderation.queue().then(setQueue, () => setFailed(true));
  }, [moderation]);
  useEffect(load, [load]);
  const close = useCallback(() => {
    setOpen(null);
    load();
  }, [load]);

  if (open) return <ApplicationScreen application={open} onBack={close} />;
  if (failed) return <ErrorScreen onRetry={load} />;
  if (!queue) return <ScreenSkeleton />;
  return <QueueView queue={queue} onOpen={setOpen} onBack={onBack} title={t('common.admin.applications')} />;
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
