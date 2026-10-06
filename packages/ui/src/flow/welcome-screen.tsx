import './welcome.css';
import type { ReactNode } from 'react';
import type { Welcome } from '../account/registration/registration-flow';
import { brandVars } from '../account/registration/brand-vars';
import { useScreenView } from '../context/analytics-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
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
const LOGO_SIZE = 64;
const POINT_ICON = 20;

// Screen 1 of the registration (G58, docs/118), drawn by the values of the approved mockup
// (docs/goals/g58/src/1-welcome.html): the brand, «Nima uchun» rows, the consent at the bottom.
export function WelcomeScreen({ welcome, children, ready, onContinue }: WelcomeScreenProps) {
  useScreenView('welcome');
  useScreenBackground('tinted');
  const i18n = useI18n();
  const brand = useBrand();
  const { colors } = brand.theme;
  // The values a point may name: the brand and the start bonus of the driver (docs/12).
  const values = { brand: brand.name, bonus: i18n.formatMoney(brand.promo.amount) };
  return (
    <div className="welcome" style={brandVars(colors)}>
      <div className="welcome-brand">
        <img
          className="welcome-logo"
          src={logoUrl(welcome.logo)}
          alt={brand.name}
          width={LOGO_SIZE}
          height={LOGO_SIZE}
        />
        <h1 className="welcome-name">{brand.name}</h1>
        <p className="welcome-slogan">{brand.slogan}</p>
      </div>
      <h2 className="welcome-head">{i18n.t('account.welcome.why', { brand: brand.name })}</h2>
      <ul className="welcome-points">
        {welcome.points.map((point) => (
          <li key={point.textKey} className="welcome-point">
            <span className="welcome-tile">
              <Icon name={point.icon} size={POINT_ICON} color={colors.bg} />
            </span>
            {i18n.t(point.textKey, values)}
          </li>
        ))}
      </ul>
      {children}
      <MainButton text={i18n.t('common.continue')} disabled={!ready} onClick={onContinue} />
    </div>
  );
}
