import { COMPLAINT_COMMENT_MAX, COMPLAINT_REASONS, type ComplaintReason } from '@platform/contracts';
import { Text, Title } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { Cell, List, Section, Textarea } from '../components';
import { useAnalytics, useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { errorKey } from '../market/error-text';
import { EmptyState } from '../states/empty-state';
import { BackButton } from '../telegram/back-button';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';
import '../market/market.css';

type Props = { readonly bookingId: string; readonly onBack: () => void };
type Step = 'edit' | 'busy' | 'sent' | { readonly failed: unknown };

// A complaint about the other side of a ride (docs/17): a reason from the list, a comment if needed.
// The other side never sees who complained.
export function ComplaintScreen({ bookingId, onBack }: Props) {
  useScreenView('complaints.form');
  const { t } = useI18n();
  const { track } = useAnalytics();
  const { feedback } = useApiClients();
  const [reason, setReason] = useState<ComplaintReason | null>(null);
  const [comment, setComment] = useState('');
  const [step, setStep] = useState<Step>('edit');
  const send = async (chosen: ComplaintReason) => {
    setStep('busy');
    try {
      await feedback.complain({ bookingId, reason: chosen, comment: comment.trim() });
      track({ name: 'complaint_sent', screen: 'complaints.form' });
      haptic.success();
      setStep('sent');
    } catch (error) {
      haptic.error();
      setStep({ failed: error });
    }
  };
  if (step === 'sent')
    return (
      <div className="market">
        <BackButton onClick={onBack} />
        <EmptyState icon="complaints" title={t('complaints.sent')} description={t('complaints.anonymous')} />
      </div>
    );
  return (
    <div className="market">
      <BackButton onClick={onBack} />
      <Title weight="1" className="market-title">
        {t('complaints.title')}
      </Title>
      <List>
        <Section header={t('complaints.reasonTitle')} footer={t('complaints.anonymous')}>
          {COMPLAINT_REASONS.map((known) => (
            <Cell
              key={known}
              onClick={() => {
                haptic.select();
                setReason(known);
              }}
              after={known === reason ? <Icon name="selected" /> : null}
            >
              {t(`complaints.reason.${known}`)}
            </Cell>
          ))}
        </Section>
        <Section header={t('complaints.commentTitle')}>
          <Textarea
            placeholder={t('complaints.commentPlaceholder')}
            value={comment}
            maxLength={COMPLAINT_COMMENT_MAX}
            onChange={(event) => setComment(event.target.value)}
          />
        </Section>
        {typeof step === 'object' ? (
          <Text className="step-hint notify-note">{t(errorKey(step.failed))}</Text>
        ) : null}
      </List>
      {reason && step !== 'busy' ? (
        <MainButton text={t('complaints.send')} onClick={() => send(reason)} />
      ) : null}
    </div>
  );
}
