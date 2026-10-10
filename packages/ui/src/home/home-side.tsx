import type { ReactNode } from 'react';
import { useAccount } from '../account/account-context';
import type { ProfilePart } from '../account/profile/profile-rows';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { useDriver } from '../driver/driver-context';
import { Icon } from '../icons';
import { UzPlate } from '../plate/uz-plate';
import { useHomeTap } from './use-home-tap';
import './home-side.css';

const STAR = 16;

type Props = { readonly openProfile: (part?: ProfilePart) => void };

// The right part of the head of a passenger (G76, mockup g76/1): the rating the drivers see before
// «Tasdiqlash» opens «Baholarim»; no ratings yet, «Yangi» opens how the drivers see the person; no
// photo or a refused one, «Rasm qoʻshing» in yellow opens «Profil» where the photo goes.
export function PassengerSide({ openProfile }: Props) {
  const { t, formatRating } = useI18n();
  const { colors } = useBrand().theme;
  const tap = useHomeTap();
  const profile = useAccount()?.profile;
  if (!profile) return null;
  if (!profile.hasAvatar || profile.avatarStatus === 'rejected')
    return (
      <Side warn label={t('home.side.photo')} onClick={tap('side_photo', () => openProfile())}>
        {t('home.side.photoHint')}
      </Side>
    );
  const { rating } = profile;
  if (rating === null)
    return (
      <Side label={t('home.side.rating')} onClick={tap('side_look', () => openProfile('look'))}>
        {t('reviews.new')}
      </Side>
    );
  return (
    <Side label={t('home.side.rating')} onClick={tap('side_rating', () => openProfile('reviews'))}>
      <Icon name="star" size={STAR} color={colors.accent} filled />
      {formatRating(rating)}
    </Side>
  );
}

// The right part of the head of a driver: the car and its plate open «Profil» with the car; before
// the car is told, «Mashina · Qoʻshing» in yellow opens the application.
export function DriverSide({ openProfile }: Props) {
  const { t } = useI18n();
  const tap = useHomeTap();
  const driver = useDriver();
  if (!driver) return null;
  const { car } = driver.application;
  if (!car)
    return (
      <Side warn label={t('home.side.car')} onClick={tap('side_car', driver.editCar)}>
        {t('home.side.addCar')}
      </Side>
    );
  const color = t(`drivers.color.${car.color}`).toLocaleLowerCase('uz');
  return (
    <Side
      label={t('home.trip.car', { model: car.model, color })}
      onClick={tap('side_car', () => openProfile())}
    >
      <UzPlate plate={car.plate} size="s" />
    </Side>
  );
}

type SideProps = {
  readonly label: string;
  readonly warn?: boolean;
  readonly onClick: () => void;
  readonly children: ReactNode;
};

function Side({ label, warn = false, onClick, children }: SideProps) {
  const { colors } = useBrand().theme;
  const style = warn ? { background: colors.attentionSoft, color: colors.attentionInk } : undefined;
  return (
    <button
      type="button"
      className={warn ? 'home-side home-side-warn' : 'home-side'}
      style={style}
      onClick={onClick}
    >
      <span className="home-side-label">{label}</span>
      <span className="home-side-value">{children}</span>
    </button>
  );
}
