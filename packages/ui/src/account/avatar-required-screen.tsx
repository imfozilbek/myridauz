import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { AvatarPicker } from './profile/avatar-picker';
import { StepLayout } from './step-layout';

// Shown when the brand setting makes a photo required for passengers (docs/05).
export function AvatarRequiredScreen() {
  useScreenView('avatar_required');
  const { t } = useI18n();
  return (
    <StepLayout
      icon="camera"
      title={t('account.avatar.requiredTitle')}
      hint={t('account.avatar.requiredText')}
    >
      <div className="profile-photo">
        <AvatarPicker />
      </div>
    </StepLayout>
  );
}
