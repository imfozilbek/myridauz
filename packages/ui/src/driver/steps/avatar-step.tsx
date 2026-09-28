import { useAccount } from '../../account/account-context';
import { AvatarPicker } from '../../account/profile/avatar-picker';
import { ProfilePhoto } from '../../account/profile/profile-photo';
import { StepLayout } from '../../account/step-layout';
import { useScreenView } from '../../context/analytics-context';
import { useI18n } from '../../context/i18n-context';
import { BackButton } from '../../telegram/back-button';
import { MainButton } from '../../telegram/bottom-button';

type AvatarStepProps = { readonly onBack: () => void; readonly onDone: () => void };

// The face of the driver is required (docs/05): a selfie with the front camera, like in the profile.
export function AvatarStep({ onBack, onDone }: AvatarStepProps) {
  useScreenView('driver.avatar');
  const { t } = useI18n();
  const account = useAccount();
  const profile = account?.profile;
  const hasAvatar = profile?.hasAvatar === true;
  return (
    <StepLayout icon="profile" title={t('drivers.avatar.title')} hint={t('drivers.avatar.hint')}>
      <BackButton onClick={onBack} />
      <div className="step-head">
        {profile ? <ProfilePhoto userId={profile.id} name={profile.firstName} hasAvatar={hasAvatar} /> : null}
        <AvatarPicker />
      </div>
      {hasAvatar ? <MainButton text={t('common.continue')} onClick={onDone} /> : null}
    </StepLayout>
  );
}
