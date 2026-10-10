import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { HomeNote } from '../home/home-note';
import { useAccount } from './account-context';

const TINT = '8%';

// A refused photo on the main screen (G75, docs/158 Ж): why, and a tap opens «Profil» where the new
// photo goes. The bot says it once; here it stays until a new photo is sent.
export function FaceNotice({ onOpen }: { readonly onOpen: () => void }) {
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  const profile = useAccount()?.profile;
  if (profile?.avatarStatus !== 'rejected') return null;
  const reason = profile.avatarReason ? t(`moderation.faceReason.${profile.avatarReason}`) : '';
  return (
    <button type="button" className="home-note-button" onClick={onOpen}>
      <HomeNote
        icon="error"
        ink={colors.dangerText}
        soft={`color-mix(in srgb, ${colors.danger} ${TINT}, ${colors.bg})`}
        mark={colors.dangerText}
        title={t('account.avatar.rejectedTitle')}
        text={t('account.avatar.rejected', { reason })}
      />
    </button>
  );
}
