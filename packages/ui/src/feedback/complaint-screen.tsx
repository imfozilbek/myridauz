import { COMPLAINT_COMMENT_MAX, COMPLAINT_REASONS, type ComplaintReason } from '@platform/contracts';
import { Text } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { Textarea } from '../components';
import { useAnalytics, useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { errorKey } from '../market/error-text';
import { useDraft } from '../screen/draft';
import { Screen } from '../screen/screen';
import { TickRows } from '../sheet/tick-rows';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';
import { useScreenBackground } from '../telegram/screen-background';
import { brandVars } from '../theme/brand-vars';
import './complaint.css';
import { DraftNote } from './draft-note';
import { checkComplaintDraft, complaintDraftKey, type ComplaintDraft } from './feedback-draft';
import { SentScreen } from './sent-screen';

type Props = {
  readonly bookingId: string;
  readonly onBack: () => void;
  readonly onClose?: (() => void) | undefined;
};
// The reasons of the mockup g75/5 A in its order; a false profile or a fraud goes as «Boshqa» with
// the comment (G75, docs/163 dispute 9).
const SHOWN: readonly ComplaintReason[] = [
  'harassment',
  'unsafe_driving',
  'price_changed',
  'car_mismatch',
  'no_show',
  'other',
];

type Step = 'edit' | 'sent' | { readonly failed: unknown };

// A complaint about the other side of a ride (docs/17, mockup g75/5 A): one or more reasons as ticks
// (owner decision 10.10.2026), a comment if needed. The other side never sees who complained.
export function ComplaintScreen({ bookingId, onBack, onClose }: Props) {
  useScreenView('complaints.form');
  const { t } = useI18n();
  const { track } = useAnalytics();
  const { feedback } = useApiClients();
  const { colors } = useBrand().theme;
  useScreenBackground();
  const draft = useDraft(complaintDraftKey(bookingId), checkComplaintDraft);
  const [form, setForm] = useState<ComplaintDraft>(() => draft.restored ?? { reasons: [], comment: '' });
  const { reasons, comment } = form;
  const [step, setStep] = useState<Step>('edit');
  const change = (patch: Partial<ComplaintDraft>) => {
    const next = { ...form, ...patch };
    setForm(next);
    draft.save(next);
  };
  const toggle = (reason: ComplaintReason) =>
    change({
      reasons: reasons.includes(reason) ? reasons.filter((known) => known !== reason) : [...reasons, reason],
    });
  // The promise keeps the loader on the button while sending (docs/94 C5).
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
    <div className="complaint" style={brandVars(colors)}>
      <Screen onBack={onBack} />
      <h1 className="complaint-title">
        {t('complaints.title')}
        <small>{t('complaints.reasonTitle')}</small>
      </h1>
      <DraftNote shown={draft.restored !== null} />
      <div className="complaint-card">
        <TickRows
          ticks={SHOWN.map((known) => ({ key: known, title: t(`complaints.reason.${known}`) }))}
          chosen={reasons}
          onToggle={toggle}
        />
      </div>
      <Textarea
        className="complaint-field"
        placeholder={t('complaints.commentPlaceholder')}
        value={comment}
        maxLength={COMPLAINT_COMMENT_MAX}
        onChange={(event) => change({ comment: event.target.value })}
      />
      <p className="complaint-note">{t('complaints.anonymous')}</p>
      {typeof step === 'object' ? (
        <Text className="step-hint notify-note">{t(errorKey(step.failed))}</Text>
      ) : null}
      {reasons.length > 0 ? <MainButton text={t('complaints.send')} onClick={send} /> : null}
    </div>
  );
}
