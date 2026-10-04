import type { CSSProperties } from 'react';
import { useAccount } from '../account/account-context';
import { ProfilePhoto } from '../account/profile/profile-photo';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { useDriver } from '../driver/driver-context';
import { Icon } from '../icons';
import { useLoad } from '../market/use-list';
import { HomeCard } from './home-card';

const PHOTO = 42;
const ICON = 22;

// The first card of the main screen: who the person is here, like the mockup of G53. The
// passenger and the driver open their profile from it; the team sees its name and role.
export function HomeProfile({ onOpen }: { readonly onOpen: () => void }) {
  const account = useAccount();
  return account ? <PersonCard onOpen={onOpen} /> : <TeamCard />;
}

function PersonCard({ onOpen }: { readonly onOpen: () => void }) {
  const { t } = useI18n();
  const account = useAccount();
  const role = useRole();
  const { colors } = useBrand().theme;
  if (!account) return null;
  const { profile } = account;
  return (
    <HomeCard
      className="home-card-row home-profile"
      style={mint(colors.brandMint, colors.brandText)}
      label={t('account.profile.open')}
      onClick={onOpen}
    >
      <ProfilePhoto userId={profile.id} name={profile.firstName} hasAvatar={profile.hasAvatar} size={PHOTO} />
      <span className="home-card-words">
        <span className="home-card-title">{profile.firstName}</span>
        <span className="home-card-hint">{role}</span>
      </span>
    </HomeCard>
  );
}

// «Yoʻlovchi», or «Haydovchi · Cobalt, oq» with the car of the application.
function useRole(): string {
  const { t } = useI18n();
  const driver = useDriver();
  if (!driver) return t('home.role.passenger');
  const { car } = driver.application;
  if (!car) return t('home.role.driverNew');
  const color = t(`drivers.color.${car.color}`).toLocaleLowerCase('uz');
  return t('home.role.driver', { model: car.model, color });
}

function TeamCard() {
  const { t } = useI18n();
  const { moderation } = useApiClients();
  const { colors } = useBrand().theme;
  const { value } = useLoad(() => moderation.me(), 'home.me');
  if (!value) return null;
  return (
    <HomeCard className="home-card-row home-profile" style={mint(colors.brandMint, colors.brandText)}>
      <span className="profile-round profile-empty" style={{ width: PHOTO, height: PHOTO }}>
        <Icon name="profile" size={ICON} color={colors.brandText} />
      </span>
      <span className="home-card-words">
        <span className="home-card-title">{value.firstName}</span>
        <span className="home-card-hint">{t(`home.role.${value.role}`)}</span>
      </span>
    </HomeCard>
  );
}

// The empty photo is the light color of the app, like the mockup.
const mint = (color: string, ink: string) => ({ '--mint': color, '--mint-ink': ink }) as CSSProperties;
