import { Cell, Section } from '../../components';
import { useBrand } from '../../context/brand-context';
import { useI18n } from '../../context/i18n-context';
import { Icon } from '../../icons';
import { usePlatform } from '../../telegram/in-telegram-context';
import { useAccount } from '../account-context';
import { ProfilePhoto } from './profile-photo';

const PHOTO_SIZE = 44;

// The first line of the main screen, like the own account at the top of Telegram settings (docs/21).
export function ProfileCell({ onOpen }: { readonly onOpen: () => void }) {
  const account = useAccount();
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  // A chevron only on iOS, like the other cells of the main screen.
  const chevron = usePlatform() === 'ios' ? <Icon name="next" size={20} color={colors.textMuted} /> : null;
  if (!account) return null;
  const { profile } = account;
  return (
    <Section>
      <Cell
        before={
          <ProfilePhoto
            userId={profile.id}
            name={profile.firstName}
            hasAvatar={profile.hasAvatar}
            size={PHOTO_SIZE}
          />
        }
        subtitle={t('account.profile.open')}
        after={chevron}
        onClick={onOpen}
      >
        {profile.firstName}
      </Cell>
    </Section>
  );
}
