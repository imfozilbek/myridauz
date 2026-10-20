import {
  type ApplicationDetail,
  type CarPhotoKind,
  type Decision,
  type DecisionInput,
  type ModerationReason,
} from '@platform/contracts';
import { useRef, useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { useLoad } from '../market/use-list';
import { ApproveFlow } from '../moderation/approve-flow';
import { BlockSheet } from '../moderation/block-sheet';
import { PhotoScreen } from '../moderation/photo-screen';
import { ReasonsSheet } from '../moderation/reasons-sheet';
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
type ReasonsMode = 'reject' | 'request_changes';
const NO_TICKS: Record<ReasonsMode, readonly ModerationReason[]> = { reject: [], request_changes: [] };

// The application of a driver (docs/04, docs/120, mockup g67/2 screen 3): the car photos, the car,
// the plate and the driver; «Tasdiqlash» after the plate check, «Tuzatish», «Rad etish», «Bloklash».
export function ApplicationCase({ id, onBack, ...props }: CaseProps) {
  const { moderation } = useApiClients();
  const { value, failed, error, reload } = useLoad(() => moderation.get(id));
  if (failed) return <ErrorScreen onRetry={reload} onBack={onBack} error={error} />;
  if (!value) return <ScreenSkeleton onBack={onBack} />;
  return <Application detail={value} onBack={onBack} {...props} />;
}

type ApplicationProps = Omit<CaseProps, 'id' | 'item'> & { readonly detail: ApplicationDetail };

function Application({ detail, progress, onBack, onDone }: ApplicationProps) {
  const { t } = useI18n();
  const { moderation } = useApiClients();
  const [mode, setMode] = useState<Mode>('view');
  const [fixedPlate, setFixedPlate] = useState<string | null>(null);
  // The ticks of «Tuzatish» and of «Rad etish» apart: one never sends the other's (G79 К10).
  const [ticked, setTicked] = useState<Record<ReasonsMode, readonly ModerationReason[]>>(NO_TICKS);
  const { failure, fail, clear } = useFailure();
  const { userId } = detail;
  // One decision at a time: a second quick tap sends nothing (G89 M5).
  const busy = useRef(false);
  const act = async (work: () => Promise<unknown>, outcome: Outcome) => {
    if (busy.current) return;
    busy.current = true;
    clear();
    try {
      await work();
      haptic.success();
      onDone(outcome);
    } catch (caught) {
      fail(caught);
      setMode('view');
    } finally {
      busy.current = false;
    }
  };
  const decide = (decision: DecisionInput) => void act(() => moderation.decide(userId, decision), 'decided');
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
  if (mode !== 'view' && mode !== 'reject' && mode !== 'request_changes' && mode !== 'block')
    return <PhotoScreen userId={userId} kind={mode} onBack={back} />;
  // The reasons of «Tuzatish» or of «Rad etish» and the days of a block in sheets over the
  // application (G78 К2, sheet 6).
  const reasons: ReasonsMode = mode === 'reject' ? 'reject' : 'request_changes';
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
      <ReasonsSheet
        open={mode === 'reject' || mode === 'request_changes'}
        picked={ticked[reasons]}
        onPick={(picked) => setTicked((all) => ({ ...all, [reasons]: picked }))}
        onClose={back}
        onDone={(picked) => decide({ action: reasons, reasons: picked })}
      />
      <BlockSheet
        open={mode === 'block'}
        onClose={back}
        onBlock={(days) => act(() => moderation.block(userId, days), 'blocked')}
      />
    </div>
  );
}
