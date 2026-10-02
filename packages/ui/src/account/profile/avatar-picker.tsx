import { Text } from '@telegram-apps/telegram-ui';
import { Button } from '../../components';
import { useI18n } from '../../context/i18n-context';
import { useHasCamera } from '../../telegram/in-telegram-context';
import { useAccount } from '../account-context';
import { useFaceShot } from './use-face-shot';

// The photo is a selfie with the front camera only (owner decision, docs/47): no gallery.
// Telegram Desktop and Web have no camera, so there the person is sent to the phone.
export function AvatarPicker() {
  const account = useAccount();
  const { t } = useI18n();
  const hasCamera = useHasCamera();
  const face = useFaceShot();
  if (!account) return null;
  if (!hasCamera) return <Text className="step-hint">{t('account.avatar.phoneOnly')}</Text>;

  return (
    <>
      {face.element}
      <Button mode="bezeled" size="m" loading={face.busy} onClick={face.take}>
        {t(account.profile.hasAvatar ? 'account.avatar.change' : 'account.avatar.add')}
      </Button>
      {face.failure ? <Text className="step-error">{t(face.failure)}</Text> : null}
    </>
  );
}
