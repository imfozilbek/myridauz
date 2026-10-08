import { reasonsAt, type ModerationReason } from '@platform/contracts';
import type { Account } from '../account/account-context';
import { useAvatarUrl } from '../account/profile/use-avatar-url';
import { useI18n } from '../context/i18n-context';

type Props = {
  readonly profile: Account['profile'];
  readonly reasons: readonly ModerationReason[];
  readonly disabled: boolean;
  readonly onTake: () => void;
};

// The face is taken at the registration (G62); only when the team asks for a new one it comes back
// to the fix as one more tile, red with its reason.
export function FaceTile({ profile, reasons, disabled, onTake }: Props) {
  const { t } = useI18n();
  const url = useAvatarUrl(profile.id, profile.hasAvatar);
  const [reason] = reasonsAt(reasons, 'avatar');
  const label = t('drivers.photo.face');
  return (
    <button
      type="button"
      className={reason ? 'photo-tile photo-tile-problem' : 'photo-tile'}
      disabled={disabled}
      onClick={onTake}
    >
      <span className="photo-tile-frame">{url ? <img src={url} alt={label} /> : null}</span>
      <span className="photo-tile-text">
        <b>{label}</b>
        <span>{reason ? t(`drivers.reason.${reason}`) : t('drivers.photo.good')}</span>
      </span>
    </button>
  );
}
