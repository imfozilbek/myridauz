import {
  BLOCK_DAYS,
  type ApplicationDetail,
  type BlockInput,
  type CarPhotoKind,
  type Decision,
  type DecisionInput,
} from '@platform/contracts';
import { useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { ChoiceStep } from '../driver/steps/choice-step';
import { useLoad } from '../market/use-list';
import { allowBlock } from '../moderation/ask-block';
import { ApproveFlow } from '../moderation/approve-flow';
import { PhotoScreen } from '../moderation/photo-screen';
import { ReasonsStep } from '../moderation/reasons-step';
import { Screen } from '../screen/screen';
import { ActionFailure } from '../states/action-failure';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { useFailure } from '../states/use-failure';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';
import { ApplicationDetails } from './application-details';
import { CaseButtons } from './case-buttons';
import { CaseHeader } from './case-header';
import { CasePhotos } from './case-photos';
import type { CaseProps, Outcome } from './case-props';

type Mode = 'view' | Decision | 'block' | CarPhotoKind;

// The application of a driver (docs/04, docs/120, mockup g67/2 screen 3): the car photos, the car,
// the plate and the driver; «Tasdiqlash» after the plate check, «Tuzatish», «Rad etish», «Bloklash».
export function ApplicationCase({ id, onBack, ...props }: CaseProps) {
  const { moderation } = useApiClients();
  const { value, failed, reload } = useLoad(() => moderation.get(id));
  if (failed) return <ErrorScreen onRetry={reload} onBack={onBack} />;
  if (!value) return <ScreenSkeleton onBack={onBack} />;
  return <Application detail={value} onBack={onBack} {...props} />;
}

type ApplicationProps = Omit<CaseProps, 'id' | 'item'> & { readonly detail: ApplicationDetail };

function Application({ detail, progress, onBack, onDone }: ApplicationProps) {
  const { t } = useI18n();
  const { moderation } = useApiClients();
  const [mode, setMode] = useState<Mode>('view');
  const [fixedPlate, setFixedPlate] = useState<string | null>(null);
  const { failure, fail, clear } = useFailure();
  const { userId } = detail;
  const act = async (work: Promise<unknown>, outcome: Outcome) => {
    clear();
    try {
      await work;
      haptic.success();
      onDone(outcome);
    } catch (caught) {
      fail(caught);
      setMode('view');
    }
  };
  const decide = (decision: DecisionInput) => void act(moderation.decide(userId, decision), 'decided');
  const block = async (days: BlockInput['days']) => {
    if (await allowBlock(days ?? null, t)) await act(moderation.block(userId, days), 'blocked');
  };
  const back = () => setMode('view');
  if (mode === 'approve')
    return (
      <ApproveFlow
        application={detail}
        fixed={fixedPlate}
        onFixed={setFixedPlate}
        onBack={back}
        onApprove={(plate) => decide(plate ? { action: 'approve', plate } : { action: 'approve' })}
      />
    );
  if (mode === 'reject' || mode === 'request_changes')
    return <ReasonsStep onBack={back} onDone={(reasons) => decide({ action: mode, reasons })} />;
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
  if (mode !== 'view') return <PhotoScreen userId={userId} kind={mode} onBack={back} />;
  return (
    <div className="case">
      <Screen onBack={onBack} />
      <CaseHeader title={t('navbat.application.title', { name: detail.firstName })} progress={progress} />
      <CasePhotos userId={userId} onOpen={setMode} />
      <ApplicationDetails detail={detail} />
      <ActionFailure error={failure} />
      <CaseButtons
        actions={[
          { labelKey: 'moderation.requestChanges', onClick: () => setMode('request_changes') },
          { labelKey: 'moderation.reject', danger: true, onClick: () => setMode('reject') },
          { labelKey: 'moderation.block', danger: true, onClick: () => setMode('block') },
        ]}
      />
      <MainButton text={t('moderation.approve')} onClick={() => setMode('approve')} />
    </div>
  );
}
