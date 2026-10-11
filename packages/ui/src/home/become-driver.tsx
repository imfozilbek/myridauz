import { useAccount } from '../account/account-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { openApp } from '../telegram/open-app';
import { brandVars } from '../theme/brand-vars';
import { usePassengerState } from './dock/passenger-dock';
import { useHomeTap } from './use-home-tap';
import './become-driver.css';

const ICON = 20;
const ARROW = 18;

// «Haydovchi boʻling» under the tiles of a passenger (G66, G76, mockup g76/1): it opens the app of
// drivers. Not for a driver, and only while the block at the bottom is free (docs/165); «Profil» has
// it always.
export function BecomeDriver() {
  const { t } = useI18n();
  const account = useAccount();
  const { bots, theme } = useBrand();
  const { colors } = theme;
  const free = usePassengerState().kind === 'idle';
  const tap = useHomeTap();
  const driver = account?.profile.roles.includes('driver') ?? true;
  if (driver || !free) return null;
  return (
    <button
      type="button"
      className="become-driver"
      style={brandVars(colors)}
      onClick={tap('become_driver', () => openApp(bots.driver))}
    >
      <span className="become-driver-icon">
        <Icon name="carSide" size={ICON} color={colors.attention} />
      </span>
      <span className="become-driver-words">
        <span className="become-driver-title">{t('home.becomeDriver.title')}</span>
        <span className="become-driver-hint">{t('home.becomeDriver.hint')}</span>
      </span>
      <Icon name="next" size={ARROW} color={colors.control} />
    </button>
  );
}
