import { useBrand } from '../../context/brand-context';
import { useI18n } from '../../context/i18n-context';
import { useDriver } from '../../driver/driver-context';
import { useAccount } from '../account-context';
import { AvatarPicker } from './avatar-picker';
import { FaceStatus } from './face-status';
import { ProfilePhoto } from './profile-photo';

const PHOTO = 66;
const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

// The card on top of «Profil» (G65, mockup g65/3): the face, the name, the role and how long with
// the brand, «Rasmni almashtirish» and how the other side sees the person.
export function ProfileTop({ onLook }: { readonly onLook: () => void }) {
  const account = useAccount();
  const driver = useDriver();
  const { t } = useI18n();
  const { name } = useBrand();
  if (!account) return null;
  const { profile } = account;
  const months = Math.max(1, Math.floor((Date.now() - profile.joinedAt) / MONTH_MS));
  const role = t(driver ? 'home.role.driverNew' : 'home.role.passenger');
  return (
    <>
      <div className="profile-top">
        <ProfilePhoto
          userId={profile.id}
          name={profile.firstName}
          hasAvatar={profile.hasAvatar}
          size={PHOTO}
        />
        <span className="profile-top-text">
          <b className="profile-name">{profile.firstName}</b>
          <span className="profile-since">
            {t('account.profile.since', { role, brand: name, months: String(months) })}
          </span>
          <AvatarPicker link />
          <button type="button" className="profile-link profile-look" onClick={onLook}>
            {t(driver ? 'account.profile.look.driver' : 'account.profile.look.passenger')}
          </button>
        </span>
      </div>
      <FaceStatus profile={profile} />
    </>
  );
}
