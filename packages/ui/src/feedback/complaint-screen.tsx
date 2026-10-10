import { COMPLAINT_COMMENT_MAX, COMPLAINT_REASONS, type ComplaintReason } from '@platform/contracts';
import { Text, Title } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { Cell, List, Multiselectable, Section, Textarea } from '../components';
import { useAnalytics, useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { errorKey } from '../market/error-text';
import { useDraft } from '../screen/draft';
import { Screen } from '../screen/screen';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';
import { DraftNote } from './draft-note';
import { checkComplaintDraft, complaintDraftKey, type ComplaintDraft } from './feedback-draft';
import { SentScreen } from './sent-screen';
import '../market/market.css';

type Props = {
  readonly bookingId: string;
  readonly onBack: () => void;
  readonly onClose?: (() => void) | undefined;
};
type Step = 'edit' | 'sent' | { readonly failed: unknown };

// A complaint about the other side of a ride (docs/17): one or more reasons as ticks (owner decision
// 10.10.2026), a comment if needed.
// The other side never sees who complained.
export function ComplaintScreen({ bookingId, onBack, onClose }: Props) {
  useScreenView('complaints.form');
  const { t } = useI18n();
  const { track } = useAnalytics();
  const { feedback } = useApiClients();
  const draft = useDraft(complaintDraftKey(bookingId), checkComplaintDraft);
  const [form, setForm] = useState<ComplaintDraft>(() => draft.restored ?? { reasons: [], comment: '' });
  const { reasons, comment } = form;
  const [step, setStep] = useState<Step>('edit');
  const change = (patch: Partial<ComplaintDraft>) => {
    const next = { ...form, ...patch };
    setForm(next);
    draft.save(next);
  };
  // The promise keeps the loader on the button while sending (docs/94 C5).
  const toggle = (reason: ComplaintReason) => {
    haptic.select();
    change({
      reasons: reasons.includes(reason) ? reasons.filter((known) => known !== reason) : [...reasons, reason],
    });
  };
  const send = async () => {
    try {
      await feedback.complain({
        bookingId,
        reasons: COMPLAINT_REASONS.filter((known) => reasons.includes(known)),
        comment: comment.trim(),
      });
      track({ name: 'complaint_sent', screen: 'complaints.form' });
      haptic.success();
      draft.clear();
      setStep('sent');
    } catch (error) {
      haptic.error();
      setStep({ failed: error });
    }
  };
  if (step === 'sent')
    return (
      <SentScreen
        icon="complaints"
        title={t('complaints.sent')}
        description={t('complaints.anonymous')}
        onBack={onBack}
        onClose={onClose}
      />
    );
  return (
    <div className="market">
      <Screen onBack={onBack} />
      <Title weight="1" className="market-title">
        {t('complaints.title')}
      </Title>
      <DraftNote shown={draft.restored !== null} />
      <List>
        <Section header={t('complaints.reasonTitle')} footer={t('complaints.anonymous')}>
          {COMPLAINT_REASONS.map((known) => (
            <Cell
              key={known}
              Component="label"
              before={<Multiselectable checked={reasons.includes(known)} onChange={() => toggle(known)} />}
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
            onChange={(event) => change({ comment: event.target.value })}
          />
        </Section>
        {typeof step === 'object' ? (
          <Text className="step-hint notify-note">{t(errorKey(step.failed))}</Text>
        ) : null}
      </List>
      {reasons.length > 0 ? <MainButton text={t('complaints.send')} onClick={send} /> : null}
    </div>
  );
}
