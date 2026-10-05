import {
  CHAT_SYSTEM_EVENTS,
  type ChatLine,
  type ChatSystemEvent,
  type Complaint,
  type ComplaintDecision,
  type Party,
} from '@platform/contracts';
import { Text, Title } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { CellValue } from '../account/cell-value';
import { ProfilePhoto } from '../account/profile/profile-photo';
import { Cell, List, Section } from '../components';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { IconTile } from '../icon-tile';
import { useLoad } from '../market/use-list';
import { BlockJournal } from '../moderation/block-journal';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { Screen } from '../screen/screen';
import { haptic } from '../telegram/feedback';
import { ActionFailure } from '../states/action-failure';
import { useFailure } from '../states/use-failure';
import { DecisionSection } from './decision-section';

const PHOTO_SIZE = 48;
// A system line comes as its event (docs/35): the moderator reads it in words.
const EVENT = new Set<string>(CHAT_SYSTEM_EVENTS);

// One complaint for the moderator (docs/17): both sides with their faces and history, the chat
// only on demand (the read goes to the log), then the decision.
type ReviewProps = {
  readonly onBack: () => void;
  // Decided: the queue opens the next complaint (G40, docs/106 K8).
  readonly onDecided: () => void;
};

export function ComplaintReview({ id, ...props }: ReviewProps & { readonly id: string }) {
  const { feedback } = useApiClients();
  const { value, failed, reload } = useLoad(() => feedback.complaint(id));
  if (failed) return <ErrorScreen onRetry={reload} onBack={props.onBack} />;
  if (!value) return <ScreenSkeleton onBack={props.onBack} />;
  return <Review complaint={value} {...props} />;
}

function Review({ complaint, onBack, onDecided }: ReviewProps & { readonly complaint: Complaint }) {
  const { t, formatDate } = useI18n();
  const { track } = useAnalytics();
  const { feedback } = useApiClients();
  const [lines, setLines] = useState<ChatLine[] | null>(null);
  const { failure, fail, clear } = useFailure();
  const party = (header: string, person: Party) => (
    <Section header={header}>
      <Cell
        before={
          <ProfilePhoto
            userId={person.id}
            name={person.firstName}
            hasAvatar={person.hasAvatar}
            size={PHOTO_SIZE}
          />
        }
        subtitle={t('complaints.history', {
          trips: String(person.trips),
          complaints: String(person.complaints),
        })}
        after={<CellValue>{t(`complaints.${person.role}`)}</CellValue>}
      >
        {person.firstName}
      </Cell>
    </Section>
  );
  const decide = async (decision: ComplaintDecision) => {
    clear();
    try {
      await feedback.decide(complaint.id, decision);
      track({ name: 'complaint_decided', screen: 'complaints.review' });
      haptic.success();
      onDecided();
    } catch (caught) {
      fail(caught);
    }
  };
  const lineText = (line: ChatLine) =>
    line.author === null && EVENT.has(line.text)
      ? t(`chat.system.${line.text as ChatSystemEvent}`)
      : line.text;
  const nameOf = (author: string | null) =>
    author === complaint.author.id
      ? complaint.author.firstName
      : author === null
        ? t('complaints.system')
        : complaint.against.firstName;
  return (
    <div className="market">
      <Screen onBack={onBack} />
      <Title weight="1" className="market-title">
        {t(`complaints.reason.${complaint.reason}`)}
      </Title>
      <Text className="market-subtitle">
        {t('complaints.trip', { date: formatDate(new Date(complaint.departAt)) })}
      </Text>
      <List>
        {complaint.comment ? (
          <Section>
            <Cell>{complaint.comment}</Cell>
          </Section>
        ) : null}
        {party(t('complaints.against'), complaint.against)}
        <BlockJournal userId={complaint.against.id} />
        {party(t('complaints.author'), complaint.author)}
        <Section footer={t('complaints.chatNote')}>
          {lines === null ? (
            <Cell
              before={<IconTile name="chat" />}
              onClick={() => void feedback.chat(complaint.id).then(setLines, fail)}
            >
              {t('complaints.chat')}
            </Cell>
          ) : lines.length === 0 ? (
            <Cell before={<Icon name="empty" />}>{t('complaints.chatEmpty')}</Cell>
          ) : (
            lines.map((line) => (
              <Cell key={`${line.at}-${line.text}`} subtitle={lineText(line)}>
                {nameOf(line.author)}
              </Cell>
            ))
          )}
        </Section>
        <DecisionSection
          noShow={complaint.reason === 'no_show'}
          onDecide={(decision) => void decide(decision)}
        />
        <ActionFailure error={failure} />
      </List>
    </div>
  );
}
