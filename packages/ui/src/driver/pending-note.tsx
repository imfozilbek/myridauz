import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { brandVars } from '../theme/brand-vars';
import './pending-note.css';

const ICON = 20;

// «Arizangiz tekshirilmoqda» as long as the check lasts (G53, G66, mockup g66/2 phone 1): the clock on
// the left, the words in the colors of the driver app inside its light line. No «Yopish».
export function PendingNote() {
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  return (
    <div className="pending-note" style={brandVars(colors)}>
      <Icon name="waiting" size={ICON} color={colors.brandText} />
      <span className="pending-note-words">
        <span className="pending-note-title">{t('home.check.title')}</span>
        <span className="pending-note-text">{t('home.check.text')}</span>
      </span>
    </div>
  );
}
