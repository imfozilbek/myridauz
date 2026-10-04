import type { ApplicationSummary, PersonId } from '@platform/contracts';
import { Button, Caption } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { StepLayout } from '../account/step-layout';
import { useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { PlateView } from '../driver/plate-view';
import { PlateStep } from '../driver/steps/plate-step';
import { useBlobUrl } from '../media/use-blob-url';
import { Screen } from '../screen/screen';
import { MainButton } from '../telegram/bottom-button';

type ApproveFlowProps = {
  readonly application: ApplicationSummary;
  // The plate fixed by the photo, null if none. Kept by the application: Back and a failed decision
  // do not lose it (docs/94 B9).
  readonly fixed: string | null;
  readonly onFixed: (plate: string | null) => void;
  readonly onBack: () => void;
  // plate: set when the moderator fixed it by the photo.
  readonly onApprove: (plate?: string) => void;
};

// Before approving, the moderator compares the plate with the front photo and may fix it (docs/50).
export function ApproveFlow({ application, fixed, onFixed, onBack, onApprove }: ApproveFlowProps) {
  const [fixing, setFixing] = useState(false);
  const plate = fixed ?? application.car.plate;
  if (fixing) {
    return (
      <PlateStep
        screen="moderation.plate"
        initial={plate}
        reasons={[]}
        onBack={() => setFixing(false)}
        onDone={(next) => {
          onFixed(next === application.car.plate ? null : next);
          setFixing(false);
        }}
      />
    );
  }
  return (
    <PlateCheck
      userId={application.userId}
      plate={plate}
      fixed={fixed !== null}
      onBack={onBack}
      onFix={() => setFixing(true)}
      onApprove={() => (fixed ? onApprove(fixed) : onApprove())}
    />
  );
}

type PlateCheckProps = {
  readonly userId: PersonId;
  readonly plate: string;
  readonly fixed: boolean;
  readonly onBack: () => void;
  readonly onFix: () => void;
  readonly onApprove: () => void;
};

function PlateCheck({ userId, plate, fixed, onBack, onFix, onApprove }: PlateCheckProps) {
  useScreenView('moderation.plate_check');
  const { t } = useI18n();
  const { moderation } = useApiClients();
  const photo = useBlobUrl(() => moderation.photo(userId, 'front'), `${userId}:front`);
  return (
    <StepLayout icon="car" title={t('moderation.plateCheck.title')} hint={t('moderation.plateCheck.hint')}>
      <Screen onBack={onBack} />
      <div className="plate-check">
        {/* The place of the photo is kept while it loads: the plate and buttons never jump (G41). */}
        {photo ? (
          <img className="plate-check-photo" src={photo} alt={t('drivers.photo.front')} />
        ) : (
          <span className="plate-check-photo moderation-photo-empty" />
        )}
        <PlateView plate={plate} />
        {fixed ? <Caption className="plate-check-fixed">{t('moderation.plateCheck.fixed')}</Caption> : null}
        <Button mode="bezeled" size="m" onClick={onFix}>
          {t('moderation.plateCheck.fix')}
        </Button>
      </div>
      <MainButton text={t('moderation.plateCheck.approve')} onClick={onApprove} />
    </StepLayout>
  );
}
