import { BLOCK_DAYS, type BlockInput, type Complaint, type ComplaintDecision } from '@platform/contracts';
import { useState } from 'react';
import { Switch } from '../components';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { RefundSection } from '../complaints/refund-section';
import { ChoiceStep } from '../driver/steps/choice-step';
import { Icon } from '../icons';
import { useLoad } from '../market/use-list';
import { allowBlock } from '../moderation/ask-block';
import { Screen } from '../screen/screen';
import { ActionFailure } from '../states/action-failure';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { useFailure } from '../states/use-failure';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';
import { CaseButtons } from './case-buttons';
import { CaseHeader } from './case-header';
import type { CaseProps } from './case-props';
import { ComplaintChat } from './complaint-chat';
import { ComplaintTrip } from './complaint-trip';
import { ComplaintWords } from './complaint-words';

const ARROW = 16;
const CHAT = 18;

// A complaint (docs/17, docs/120, mockup g67/2 screen 4): who on whom and why, the words, the trip,
// the chat on demand; «Ogohlantirish», «Bloklash» for 1, 7, 30 days or for good, «Buzilish yoʻq».
export function ComplaintCase({ id, onBack, ...props }: CaseProps) {
  const { feedback } = useApiClients();
  const { value, failed, reload } = useLoad(() => feedback.complaint(id));
  if (failed) return <ErrorScreen onRetry={reload} onBack={onBack} />;
  if (!value) return <ScreenSkeleton onBack={onBack} />;
  return <Review complaint={value} onBack={onBack} {...props} />;
}

type ReviewProps = Omit<CaseProps, 'id' | 'item'> & { readonly complaint: Complaint };

function Review({ complaint, progress, onBack, onDone }: ReviewProps) {
  const { t } = useI18n();
  const { track } = useAnalytics();
  const { feedback } = useApiClients();
  const [mode, setMode] = useState<'view' | 'block' | 'chat'>('view');
  const [refund, setRefund] = useState(false);
  const { failure, fail, clear } = useFailure();
  const open = complaint.status !== 'resolved';
  const decide = async (decision: ComplaintDecision) => {
    clear();
    try {
      await feedback.decide(complaint.id, { ...decision, refund });
      track({ name: 'complaint_decided', screen: 'complaints.review' });
      haptic.success();
      onDone(decision.action === 'block' ? 'blocked' : 'decided');
    } catch (caught) {
      fail(caught);
      setMode('view');
    }
  };
  const block = async (days: BlockInput['days']) => {
    if (await allowBlock(days ?? null, t)) await decide({ action: 'block', days: days ?? null });
  };
  const back = () => setMode('view');
  if (mode === 'chat') return <ComplaintChat complaint={complaint} onBack={back} />;
  if (mode === 'block')
    return (
      <ChoiceStep
        screen="moderation.block"
        icon="blocked"
        title={t('moderation.block.title')}
        choices={[
          ...BLOCK_DAYS.map((value) => ({
            value,
            label: t('moderation.block.days', { days: String(value) }),
          })),
          { value: null, label: t('moderation.block.forever') },
        ]}
        onBack={back}
        onDone={block}
      />
    );
  const { author, against } = complaint;
  const role = t(`complaints.${against.role}`).toLocaleLowerCase('uz');
  return (
    <div className="case">
      <Screen onBack={onBack} />
      <CaseHeader title={t('navbat.complaint.title')} progress={progress} />
      <div className="case-card">
        <div className="case-row">
          <span className="case-muted">{t('navbat.complaint.who')}</span>
          <b>
            {t('navbat.complaint.whoValue', { author: author.firstName, against: against.firstName, role })}
          </b>
        </div>
        <div className="case-row">
          <span className="case-muted">{t('navbat.complaint.reason')}</span>
          <b>{complaint.reasons.map((reason) => t(`complaints.reason.${reason}`)).join(', ')}</b>
        </div>
      </div>
      <ComplaintWords complaint={complaint} />
      <ComplaintTrip tripId={complaint.tripId} />
      <button type="button" className="case-card case-link" onClick={() => setMode('chat')}>
        <span className="navbat-icon">
          <Icon name="write" size={CHAT} />
        </span>
        <b className="case-link-title">{t('navbat.complaint.chat')}</b>
        <Icon name="next" size={ARROW} />
      </button>
      {open && complaint.reasons.includes('no_show') ? (
        <label className="case-card case-row">
          <span>{t('complaints.refund')}</span>
          <Switch checked={refund} onChange={() => setRefund(!refund)} />
        </label>
      ) : null}
      <RefundSection complaint={complaint} onDone={() => onDone('decided')} />
      <ActionFailure error={failure} />
      {open ? (
        <>
          <CaseButtons
            actions={[
              { labelKey: 'moderation.block', onClick: () => setMode('block') },
              { labelKey: 'navbat.complaint.none', onClick: () => void decide({ action: 'none' }) },
            ]}
          />
          <MainButton text={t('complaints.warning')} onClick={() => decide({ action: 'warning' })} />
        </>
      ) : null}
    </div>
  );
}
