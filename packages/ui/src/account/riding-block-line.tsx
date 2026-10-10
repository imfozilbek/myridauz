import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { brandVars } from '../theme/brand-vars';

// Blocked on the road (owner decision 10.10.2026, docs/158 Ж): the app stays open for the trip on
// the way only, and this line on top says why the rest is closed.
export function RidingBlockLine() {
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  return (
    <p className="riding-block" role="status" style={brandVars(colors)}>
      {t('account.blocked.riding')}
    </p>
  );
}
