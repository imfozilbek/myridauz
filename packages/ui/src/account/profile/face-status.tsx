import type { MyProfile } from '@platform/contracts';
import { Text } from '@telegram-apps/telegram-ui';
import { useI18n } from '../../context/i18n-context';

// The check of the own face (G58, docs/118): while it is checked only the person sees it; a refused
// photo says why and asks for a new one. Rida works all the time.
export function FaceStatus({ profile }: { readonly profile: MyProfile }) {
  const { t } = useI18n();
  if (profile.avatarStatus === 'pending')
    return <Text className="step-hint">{t('account.avatar.pending')}</Text>;
  if (profile.avatarStatus !== 'rejected') return null;
  const reason = profile.avatarReason ? t(`moderation.faceReason.${profile.avatarReason}`) : null;
  return <Text className="step-error">{t('account.avatar.rejected', { reason: reason ?? '' })}</Text>;
}
