import type { ChatLine, Complaint, ComplaintDecision, Party } from '@platform/contracts';
import { Text, Title } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { ProfilePhoto } from '../account/profile/profile-photo';
import { Cell, List, Section } from '../components';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { IconTile } from '../icon-tile';
import { useLoad } from '../market/use-list';
import { EmptyState } from '../states/empty-state';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { BackButton } from '../telegram/back-button';
import { haptic } from '../telegram/feedback';
import { DecisionSection } from './decision-section';

const PHOTO_SIZE = 48;

// One complaint for the moderator (docs/17): both sides with their faces and history, the chat
// only on demand (the read goes to the log), then the decision.
export function ComplaintReview({ id, onBack }: { readonly id: string; readonly onBack: () => void }) {
  const { feedback } = useApiClients();
  const { value, failed, reload } = useLoad(() => feedback.complaint(id));
  if (failed) return <ErrorScreen onRetry={reload} />;
  if (!value) return <ScreenSkeleton />;
  return <Review complaint={value} onBack={onBack} />;
}

function Review({ complaint, onBack }: { readonly complaint: Complaint; readonly onBack: () => void }) {
  const { t, formatDate } = useI18n();
  const { track } = useAnalytics();
  const { feedback } = useApiClients();
  const [lines, setLines] = useState<ChatLine[] | null>(null);
  const [decided, setDecided] = useState(false);
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
        after={t(`complaints.${person.role}`)}
      >
        {person.firstName}
      </Cell>
    </Section>
  );
  const decide = async (decision: ComplaintDecision) => {
    try {
      await feedback.decide(complaint.id, decision);
      track({ name: 'complaint_decided', screen: 'complaints.review' });
      haptic.success();
      setDecided(true);
    } catch {
      haptic.error();
    }
  };
  if (decided)
    return (
      <>
        <BackButton onClick={onBack} />
        <EmptyState icon="selected" title={t('complaints.decided')} />
      </>
    );
  const nameOf = (author: number | null) =>
    author === complaint.author.id
      ? complaint.author.firstName
      : author === null
        ? t('complaints.system')
        : complaint.against.firstName;
  return (
    <div className="market">
      <BackButton onClick={onBack} />
      <Title weight="1" className="market-title">
        {t(`complaints.reason.${complaint.reason}`)}
      </Title>
      <Text className="market-subtitle">
        {t('complaints.trip', { date: formatDate(new Date(complaint.departAt)) })}
      </Text>
      <List>
        {complaint.comment ? (
          <Section>
            <Cell multiline>{complaint.comment}</Cell>
          </Section>
        ) : null}
        {party(t('complaints.against'), complaint.against)}
        {party(t('complaints.author'), complaint.author)}
        <Section footer={t('complaints.chatNote')}>
          {lines === null ? (
            <Cell
              before={<IconTile name="chat" />}
              onClick={() => void feedback.chat(complaint.id).then(setLines)}
            >
              {t('complaints.chat')}
            </Cell>
          ) : lines.length === 0 ? (
            <Cell before={<Icon name="empty" />}>{t('complaints.chatEmpty')}</Cell>
          ) : (
            lines.map((line) => (
              <Cell key={`${line.at}-${line.text}`} multiline subtitle={line.text}>
                {nameOf(line.author)}
              </Cell>
            ))
          )}
        </Section>
        <DecisionSection
          noShow={complaint.reason === 'no_show'}
          onDecide={(decision) => void decide(decision)}
        />
      </List>
    </div>
  );
}
