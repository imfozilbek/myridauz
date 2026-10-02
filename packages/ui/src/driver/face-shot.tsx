import type { ModerationReason } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { useState } from 'react';
import { useAccount, type Account } from '../account/account-context';
import { compressImage } from '../account/profile/compress-image';
import { useAvatarUrl } from '../account/profile/use-avatar-url';
import { useI18n } from '../context/i18n-context';
import { errorKey } from '../market/error-text';
import { usePhotoTaker } from '../media/use-photo-taker';
import { haptic } from '../telegram/feedback';
import { PhotoSlot } from './photo-slot';

// The face of the driver is required (docs/05): a selfie with the front camera, like in the
// profile, never the gallery (docs/47). It is the photo of the profile.
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

type FaceSlotProps = {
  readonly profile: Account['profile'];
  readonly reasons: readonly ModerationReason[];
  readonly disabled: boolean;
  readonly onTake: () => void;
};

// The face as the first of the photos (G34): the same row as a photo of the car.
export function FaceSlot({ profile, ...rest }: FaceSlotProps) {
  const { t } = useI18n();
  const url = useAvatarUrl(profile.id, profile.hasAvatar);
  return (
    <PhotoSlot
      {...rest}
      icon="face"
      label={t('drivers.photo.face')}
      url={url}
      taken={profile.hasAvatar}
      place="avatar"
    />
  );
}
