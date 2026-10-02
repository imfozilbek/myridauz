import type { ModerationReason } from '@platform/contracts';
import type { Account } from '../account/account-context';
import { useAvatarUrl } from '../account/profile/use-avatar-url';
import { useI18n } from '../context/i18n-context';
import { PhotoSlot } from './photo-slot';

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
