import type { MyProfile } from '@platform/contracts';
import { useI18n } from '../../context/i18n-context';
import './face-status.css';

// The check of the own face (G58, docs/118): while the face of a driver is checked only the person
// sees it; a passenger photo shows at once and the team checks it after (G51). A refused photo says
// why and asks for a new one. Rida works all the time.
export function FaceStatus({ profile }: { readonly profile: MyProfile }) {
  const { t } = useI18n();
  if (profile.avatarStatus === 'pending' && profile.roles.includes('driver'))
    return <p className="face-status">{t('account.avatar.pending')}</p>;
  if (profile.avatarStatus !== 'rejected') return null;
  const reason = profile.avatarReason ? t(`moderation.faceReason.${profile.avatarReason}`) : null;
  return (
    <p className="face-status face-status-error">{t('account.avatar.rejected', { reason: reason ?? '' })}</p>
  );
}
