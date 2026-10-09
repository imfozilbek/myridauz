import { useAccount } from '../account/account-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { openInTelegram } from '../telegram/feedback';
import { brandVars } from '../theme/brand-vars';
import { nextBookings } from './home-items';
import { usePassengerData } from './passenger-data';
import { useHomeTap } from './use-home-tap';
import './become-driver.css';

const ICON = 22;
const ARROW = 16;

// «Haydovchi boʻling» under the tiles of a passenger (G66, docs/118, mockup g66/1): it opens the app
// of drivers. Not for a driver, and not while a seat is booked: the trip comes first then.
export function BecomeDriver() {
  const { t } = useI18n();
  const account = useAccount();
  const { bots, theme } = useBrand();
  const { colors } = theme;
  const { value } = usePassengerData();
  const tap = useHomeTap();
  const driver = account?.profile.roles.includes('driver') ?? true;
  if (driver || !value || nextBookings(value[0]).length > 0) return null;
  return (
    <button
      type="button"
      className="become-driver"
      style={brandVars(colors)}
      onClick={tap('become_driver', () => openInTelegram(`https://t.me/${bots.driver}?startapp`))}
    >
      <span className="become-driver-icon">
        <Icon name="carSide" size={ICON} color={colors.attention} />
      </span>
      <span className="become-driver-words">
        <span className="become-driver-title">{t('home.becomeDriver.title')}</span>
        <span className="become-driver-hint">{t('home.becomeDriver.hint')}</span>
      </span>
      <Icon name="next" size={ARROW} color={colors.attention} />
    </button>
  );
}
