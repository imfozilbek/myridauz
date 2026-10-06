import type { TranslationKey } from '@platform/i18n';
import { useState } from 'react';
import { useI18n } from '../../context/i18n-context';
import { errorKey } from '../../market/error-text';
import { usePhotoTaker } from '../../media/use-photo-taker';
import { haptic } from '../../telegram/feedback';
import { useAccount } from '../account-context';
import { compressImage } from './compress-image';

// A new face goes up small (docs/05) and the team checks it (G58); a failure says why.
export function useFaceUpload() {
  const account = useAccount();
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
  return { upload, busy, failure };
}

// The face in the driver application: our camera with the oval, the same photo as the profile (G34).
export function useFaceShot() {
  const { t } = useI18n();
  const { upload, busy, failure } = useFaceUpload();
  const camera = usePhotoTaker('user', (photo) => void upload(photo));
  const take = () =>
    camera.open({
      guide: 'face',
      title: t('account.avatar.cameraTitle'),
      hint: t('account.avatar.cameraHint'),
    });
  return { element: camera.element, isOpen: camera.isOpen, take, busy, failure };
}
