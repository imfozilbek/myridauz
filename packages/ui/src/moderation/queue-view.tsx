import './moderation.css';
import { type ApplicationSummary } from '@platform/contracts';
import { Title } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { Cell, List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';
import { EmptyState } from '../states/empty-state';
import { useKeepPlace } from '../screen/keep-place';
import { useListPlace } from '../screen/list-memory';
import { Screen } from '../screen/screen';
import { UzPlate } from '../plate/uz-plate';

export const QUEUE = 'moderation.queue';
const MINUTE_MS = 60_000;

type QueueViewProps = {
  readonly queue: readonly ApplicationSummary[];
  readonly title: string;
  readonly onOpen: (application: ApplicationSummary) => void;
  readonly onBack: () => void;
  readonly onRefresh: () => unknown;
};

// Back from an application the queue stands at the same place; an application decided by another
// moderator goes away without moving the row under the finger (docs/94 F2, S3).
export function QueueView({ queue, title, onOpen, onBack, onRefresh }: QueueViewProps) {
  useScreenView('moderation.queue');
  const { t } = useI18n();
  useListPlace(QUEUE, true);
  useKeepPlace(queue);
  const [now] = useState(Date.now);
  // How long each one waits, as the bot tells the team; a fresh one says 1 (G41, docs/90 F-A2).
  const waiting = (application: ApplicationSummary) =>
    t('moderation.queue.waiting', {
      minutes: String(Math.max(1, Math.floor((now - application.submittedAt) / MINUTE_MS))),
    });
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
        <Section header={t('moderation.queue.count', { count: String(queue.length) })}>
          {queue.map((application) => (
            <Cell
              key={application.userId}
              data-row={application.userId}
              before={<IconTile name="car" />}
              subtitle={
                <span className="plate-line">
                  {`${application.car.make} ${application.car.model}`}
                  <UzPlate plate={application.car.plate} size="s" />
                </span>
              }
              description={waiting(application)}
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
