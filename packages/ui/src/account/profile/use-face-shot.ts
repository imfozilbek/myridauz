import type { TranslationKey } from '@platform/i18n';
import { useState } from 'react';
import { useI18n } from '../../context/i18n-context';
import { errorKey } from '../../market/error-text';
import { usePhotoTaker } from '../../media/use-photo-taker';
import { haptic } from '../../telegram/feedback';
import { useAccount } from '../account-context';
import { compressImage } from './compress-image';

// The face of a person is a selfie with the front camera only, never the gallery (docs/47): the
// same photo in the profile and in the driver application (docs/05, G34).
export function useFaceShot() {
  const account = useAccount();
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<TranslationKey | null>(null);
  const upload = async (file: Blob) => {
    if (!account) return;
    setBusy(true);
    setFailure(null);
    try {
      await account.client.uploadAvatar(await compressImage(file));
      haptic.success();
      account.onAvatarChanged();
    } catch (caught) {
      haptic.error();
      setFailure(errorKey(caught, 'account.avatar.failed'));
    } finally {
      setBusy(false);
    }
  };
  const camera = usePhotoTaker('user', (photo) => void upload(photo));
  const take = () =>
    camera.open({
      guide: 'face',
      title: t('account.avatar.cameraTitle'),
      hint: t('account.avatar.cameraHint'),
    });
  return { element: camera.element, isOpen: camera.isOpen, take, busy, failure };
}
