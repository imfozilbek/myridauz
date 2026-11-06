import type { ApplicationDetail, CarInput, CarPhotoKind, ModerationReason } from '@platform/contracts';
import { useRef, useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { useLoad } from '../market/use-list';
import { BlockSheet } from '../moderation/block-sheet';
import { CarFixScreen } from '../moderation/car-fix-screen';
import { PhotoScreen } from '../moderation/photo-screen';
import { ReasonsSheet } from '../moderation/reasons-sheet';
import { Screen } from '../screen/screen';
import { ActionFailure } from '../states/action-failure';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { useFailure } from '../states/use-failure';
import { MainButton } from '../telegram/bottom-button';
import { confirm, haptic } from '../telegram/feedback';
import { useTeamOwner } from '../team/use-owner';
import { ApplicationDetails } from './application-details';
import { CaseButtons } from './case-buttons';
import { CaseHeader } from './case-header';
import { CasePhotos } from './case-photos';

type Mode = 'view' | 'fix' | 'sendBack' | 'block' | CarPhotoKind;
type CaseProps = { readonly id: string; readonly onBack: () => void };

// An application the team decided (G95, docs/224): the same photos and car as in «Navbat», the
// decision and its day on top. Approved: «Mashinani tuzatish» by the photo, «Tuzatishga qaytarish»,
// «Bloklash». Rejected: «Rad etishni bekor qilish» for the owner only.
export function DecidedCase({ id, onBack }: CaseProps) {
  const { moderation } = useApiClients();
  const { value, failed, error, reload } = useLoad(() => moderation.get(id));
  if (failed) return <ErrorScreen onRetry={reload} onBack={onBack} error={error} />;
  if (!value) return <ScreenSkeleton onBack={onBack} />;
  return <Decided detail={value} onBack={onBack} onChanged={reload} />;
}

type DecidedProps = {
  readonly detail: ApplicationDetail;
  readonly onBack: () => void;
  readonly onChanged: () => void;
};

function Decided({ detail, onBack, onChanged }: DecidedProps) {
  const { t, formatDate } = useI18n();
  const { moderation } = useApiClients();
  const owner = useTeamOwner();
  const [mode, setMode] = useState<Mode>('view');
  const [ticked, setTicked] = useState<readonly ModerationReason[]>([]);
  const { failure, fail, clear } = useFailure();
  const { userId, status } = detail;
  // One change at a time: a second quick tap sends nothing (G89 M5).
  const busy = useRef(false);
  const act = async (work: () => Promise<unknown>) => {
    if (busy.current) return;
    busy.current = true;
    clear();
    try {
      await work();
      haptic.success();
      onChanged();
    } catch (caught) {
      fail(caught);
    } finally {
      busy.current = false;
      setMode('view');
    }
  };
  const back = () => setMode('view');
  const fixCar = (car: CarInput) => void act(() => moderation.fixCar(userId, car));
  const sendBack = (reasons: ModerationReason[]) =>
    void act(() => moderation.decide(userId, { action: 'request_changes', reasons }));
  const reopen = async () => {
    if (await confirm(t('moderation.reopenAsk'), t('moderation.reopen')))
      await act(() => moderation.reopen(userId));
  };
  if (mode === 'fix') return <CarFixScreen application={detail} onBack={back} onSave={fixCar} />;
  if (mode !== 'view' && mode !== 'sendBack' && mode !== 'block')
    return <PhotoScreen userId={userId} kind={mode} onBack={back} />;
  const decidedAt = detail.history.at(-1)?.at ?? detail.submittedAt;
  const line = t('home.meta', {
    when: t(`moderation.history.${status}`),
    more: formatDate(new Date(decidedAt)),
  });
  return (
    <div className="case">
      <Screen onBack={onBack} />
      <CaseHeader title={t('navbat.application.title', { name: detail.firstName })} line={line} />
      <CasePhotos userId={userId} onOpen={setMode} />
      <ApplicationDetails detail={detail} />
      <ActionFailure error={failure} />
      {status === 'approved' ? (
        <>
          <CaseButtons
            actions={[
              { labelKey: 'moderation.sendBack', onClick: () => setMode('sendBack') },
              { labelKey: 'moderation.block', danger: true, onClick: () => setMode('block') },
            ]}
          />
          <MainButton text={t('moderation.fixCar')} onClick={() => setMode('fix')} />
        </>
      ) : null}
      {status === 'rejected' && owner ? (
        <MainButton text={t('moderation.reopen')} onClick={() => void reopen()} />
      ) : null}
      <ReasonsSheet
        open={mode === 'sendBack'}
        picked={ticked}
        onPick={setTicked}
        onClose={back}
        onDone={sendBack}
      />
      <BlockSheet
        open={mode === 'block'}
        onClose={back}
        onBlock={(days) => act(() => moderation.block(userId, days))}
      />
    </div>
  );
}
