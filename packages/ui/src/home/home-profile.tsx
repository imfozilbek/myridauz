import { formatPlate } from '@platform/contracts';
import type { CSSProperties } from 'react';
import { useAccount } from '../account/account-context';
import { ProfilePhoto } from '../account/profile/profile-photo';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { useDriver } from '../driver/driver-context';
import { HomeCard } from './home-card';

// The face of a person on the main screens of G66 (mockups g66/1, g66/2).
const FACE = 44;

// The first card of the main screen: who the person is here, like the mockup of G53. The
// passenger and the driver open their profile from it; the team has its own card (G75, team-home).
export function HomeProfile({ onOpen }: { readonly onOpen: () => void }) {
  const account = useAccount();
  return account ? <PersonCard onOpen={onOpen} /> : null;
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
      <ProfilePhoto userId={profile.id} name={profile.firstName} hasAvatar={profile.hasAvatar} size={FACE} />
      <span className="home-card-words">
        <span className="home-card-title">{profile.firstName}</span>
        <span className="home-card-hint">{role}</span>
      </span>
    </HomeCard>
  );
}

// «Yoʻlovchi», or «Haydovchi · Cobalt, oq · 01 A 123 BC» with the car of the application (mockup
// g66/2); «Haydovchi» alone before the application is sent (mockup g62/1 screen 1).
function useRole(): string {
  const { t } = useI18n();
  const driver = useDriver();
  if (!driver) return t('home.role.passenger');
  const { car, status } = driver.application;
  if (!car || status === 'draft') return t('home.role.driverNew');
  const color = t(`drivers.color.${car.color}`).toLocaleLowerCase('uz');
  return t('home.role.driver', { model: car.model, color, plate: formatPlate(car.plate) });
}

// The empty photo is the light color of the app, like the mockup.
const mint = (color: string, ink: string) => ({ '--mint': color, '--mint-ink': ink }) as CSSProperties;
