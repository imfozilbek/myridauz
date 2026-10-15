import { brandForApp } from '@platform/brands';
import type { WaitlistRole } from '@platform/contracts';
import { useScreenView } from '../context/analytics-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import './waitlist-steps.css';

const logoUrl = `${import.meta.env.BASE_URL}logo.svg`;
const LOGO = 72;
const CHIP_ICON = 15;
const ROLE_ICON = 26;
const ROLES = ['passenger', 'driver'] as const satisfies readonly WaitlistRole[];

// The first screen (mockup 2, screen 1): the brand, «Tez orada ochiladi», then «Kim boʻlib yoʻlga
// chiqasiz?» with two tiles low, where the thumb reaches; each tile in the color of its role.
export function RoleStep({ onPick }: { readonly onPick: (role: WaitlistRole) => void }) {
  useScreenView('waitlist_role');
  const { t } = useI18n();
  const brand = useBrand();
  return (
    <>
      <div className="wl-space" />
      <div className="wl-hero">
        <img className="wl-logo" src={logoUrl} alt={brand.name} width={LOGO} height={LOGO} />
        <h2 className="wl-name">{brand.name}</h2>
        <p className="wl-slogan">{brand.slogan}</p>
        <span className="wl-chip">
          <Icon name="waiting" size={CHIP_ICON} />
          {t('waitlist.soon')}
        </span>
      </div>
      <p className="wl-lead">{t('waitlist.about')}</p>
      <div className="wl-space" />
      <h1 className="wl-title wl-title-center">{t('waitlist.role.title')}</h1>
      <div className="wl-roles">
        {ROLES.map((role) => {
          const { colors } = brandForApp(brand, role).theme;
          return (
            <button key={role} type="button" className="wl-role" onClick={() => onPick(role)}>
              <span
                className="wl-role-tile"
                style={{ background: colors.stateTile, color: colors.brandText }}
              >
                <Icon name={role === 'driver' ? 'car' : 'profile'} size={ROLE_ICON} />
              </span>
              <span className="wl-role-text">
                <b>{t(`waitlist.role.${role}`)}</b>
                <span>{t(`waitlist.role.${role}Hint`)}</span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="wl-note">{t('waitlist.role.later')}</p>
    </>
  );
}
