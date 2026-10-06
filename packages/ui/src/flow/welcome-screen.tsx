import './welcome.css';
import { LargeTitle, Text } from '@telegram-apps/telegram-ui';
import type { ReactNode } from 'react';
import type { Welcome } from '../account/registration/registration-flow';
import { Cell, List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { IconTile, SIZES } from '../icon-tile';
import { MainButton } from '../telegram/bottom-button';
import { useScreenBackground } from '../telegram/screen-background';

type WelcomeScreenProps = {
  readonly welcome: Welcome;
  // At the bottom: the consent of the registration (G58).
  readonly children?: ReactNode;
  // «Davom etish» stays gray until both consents are ticked (docs/118).
  readonly ready: boolean;
  readonly onContinue: () => void;
};

// The logo of the app from its brand kit (docs/36), served from brands/<brand>/public (docs/22).
const logoUrl = (file: string) => `${import.meta.env.BASE_URL}${file}`;

// Screen 1 of the registration (G58, docs/118): the brand, «Nima uchun» in rows with an icon
// tile, the consent at the bottom.
export function WelcomeScreen({ welcome, children, ready, onContinue }: WelcomeScreenProps) {
  useScreenView('welcome');
  useScreenBackground('tinted');
  const i18n = useI18n();
  const brand = useBrand();
  // The values a point may name: the brand and the start bonus of the driver (docs/12).
  const values = { brand: brand.name, bonus: i18n.formatMoney(brand.promo.amount) };
  return (
    <div className="welcome">
      <div className="welcome-brand">
        <img
          className="welcome-logo"
          src={logoUrl(welcome.logo)}
          alt={brand.name}
          width={SIZES.hero.tile}
          height={SIZES.hero.tile}
        />
        <LargeTitle weight="1">{brand.name}</LargeTitle>
        <Text weight="2" className="welcome-slogan">
          {brand.slogan}
        </Text>
      </div>
      <List className="welcome-list">
        <Section header={i18n.t('account.welcome.why', { brand: brand.name })}>
          {welcome.points.map((point) => (
            <Cell key={point.textKey} before={<IconTile name={point.icon} size="tile" />}>
              {i18n.t(point.textKey, values)}
            </Cell>
          ))}
        </Section>
        {children}
      </List>
      <MainButton text={i18n.t('common.continue')} disabled={!ready} onClick={onContinue} />
    </div>
  );
}
