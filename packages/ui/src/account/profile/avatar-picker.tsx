import { Text } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { Button } from '../../components';
import { useI18n } from '../../context/i18n-context';
import { haptic } from '../../telegram/feedback';
import { useHasCamera } from '../../telegram/in-telegram-context';
import { useAccount } from '../account-context';
import { usePhotoTaker } from '../../media/use-photo-taker';
import { compressImage } from './compress-image';

// The photo is a selfie with the front camera only (owner decision, docs/47): no gallery.
// Telegram Desktop and Web have no camera, so there the person is sent to the phone.
export function AvatarPicker() {
  const account = useAccount();
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const hasCamera = useHasCamera();
  const upload = async (file: Blob) => {
    if (!account) return;
    setBusy(true);
    setFailed(false);
    try {
      await account.client.uploadAvatar(await compressImage(file));
      haptic.success();
      account.onAvatarChanged();
    } catch {
      haptic.error();
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };
  const camera = usePhotoTaker('user', (photo) => void upload(photo));
  if (!account) return null;
  if (!hasCamera) return <Text className="step-hint">{t('account.avatar.phoneOnly')}</Text>;
  const shot = {
    guide: 'face',
    title: t('account.avatar.cameraTitle'),
    hint: t('account.avatar.cameraHint'),
  } as const;

  return (
    <>
      {camera.element}
      <Button mode="bezeled" size="m" loading={busy} onClick={() => camera.open(shot)}>
        {t(account.profile.hasAvatar ? 'account.avatar.change' : 'account.avatar.add')}
      </Button>
      {failed ? <Text className="step-error">{t('account.avatar.failed')}</Text> : null}
    </>
  );
}
