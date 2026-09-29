import type { ModerationReason } from '@platform/contracts';
import { useAccount } from '../../account/account-context';
import { AvatarPicker } from '../../account/profile/avatar-picker';
import { ProfilePhoto } from '../../account/profile/profile-photo';
import { StepLayout } from '../../account/step-layout';
import { useScreenView } from '../../context/analytics-context';
import { useI18n } from '../../context/i18n-context';
import { BackButton } from '../../telegram/back-button';
import { MainButton } from '../../telegram/bottom-button';
import { hasProblem, ProblemNote } from '../problem-note';

type AvatarStepProps = {
  readonly reasons: readonly ModerationReason[];
  readonly onBack: () => void;
  readonly onDone: () => void;
};

// The face of the driver is required (docs/05): a selfie with the front camera, like in the profile.
// A face the team asked to retake has a red ring and the reason under it.
export function AvatarStep({ reasons, onBack, onDone }: AvatarStepProps) {
  useScreenView('driver.avatar');
  const { t } = useI18n();
  const account = useAccount();
  const profile = account?.profile;
  const hasAvatar = profile?.hasAvatar === true;
  return (
    <StepLayout icon="profile" title={t('drivers.avatar.title')} hint={t('drivers.avatar.hint')}>
      <BackButton onClick={onBack} />
      <div className="step-head">
        <span className={hasProblem(reasons, 'avatar') ? 'avatar-ring avatar-ring-problem' : 'avatar-ring'}>
          {profile ? (
            <ProfilePhoto userId={profile.id} name={profile.firstName} hasAvatar={hasAvatar} />
          ) : null}
        </span>
        <ProblemNote reasons={reasons} place="avatar" />
        <AvatarPicker />
      </div>
      {hasAvatar ? <MainButton text={t('common.continue')} onClick={onDone} /> : null}
    </StepLayout>
  );
}
