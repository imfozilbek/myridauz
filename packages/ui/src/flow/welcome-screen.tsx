import { LargeTitle, Text } from '@telegram-apps/telegram-ui';
import type { ReactNode } from 'react';
import type { Welcome } from '../account/registration/registration-flow';
import { useScreenView } from '../context/analytics-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { SIZES } from '../icon-tile';
import { Icon } from '../icons';
import { MainButton } from '../telegram/bottom-button';
import { useScreenBackground } from '../telegram/screen-background';

type WelcomeScreenProps = {
  readonly welcome: Welcome;
  // Under the points: the consent line of the registration (G34).
  readonly children?: ReactNode;
  readonly onContinue: () => void;
};

// The logo of the brand from its brand kit (docs/36), served from brands/<brand>/public (docs/22).
const LOGO = `${import.meta.env.BASE_URL}logo.svg`;

export function WelcomeScreen({ welcome, children, onContinue }: WelcomeScreenProps) {
  useScreenView('welcome');
  useScreenBackground('plain');
  const i18n = useI18n();
  const brand = useBrand();
  // The values a point may name: the brand and the start bonus of the driver (docs/12).
  const values = { brand: brand.name, bonus: i18n.formatMoney(brand.promo.amount) };
  return (
    <div className="welcome">
      <img
        className="welcome-logo"
        src={LOGO}
        alt={brand.name}
        width={SIZES.hero.tile}
        height={SIZES.hero.tile}
      />
      <LargeTitle weight="1" className="welcome-title">
        {brand.name}
      </LargeTitle>
      <Text weight="2" className="welcome-slogan">
        {brand.slogan}
      </Text>
      <Text className="welcome-text">{i18n.t(welcome.textKey, values)}</Text>
      <ul className="welcome-points">
        {welcome.points.map((point) => (
          <li key={point.textKey}>
            <Icon name={point.icon} />
            <Text>{i18n.t(point.textKey, values)}</Text>
          </li>
        ))}
      </ul>
      {children}
      <MainButton text={i18n.t('common.continue')} onClick={onContinue} />
    </div>
  );
}
