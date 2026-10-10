import './network.css';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { brandVars } from '../theme/brand-vars';
import { useOnline } from './online';

const TILE_ICON = 20;

// Without a network the screen stays as it was and says why nothing new comes (G43): a plate in the
// look of the states of the mockup g75/1 A on top. When the network is back the plate goes and the
// screens refresh themselves (onAppVisible).
export function OfflineBanner() {
  const online = useOnline();
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  if (online) return null;
  return (
    <div role="status" className="offline-banner" style={brandVars(colors)}>
      <div className="offline-plate">
        <span className="offline-tile">
          <Icon name="offline" size={TILE_ICON} />
        </span>
        <span className="offline-words">
          <b>{t('common.offline')}</b>
          <span>{t('common.offlineHint')}</span>
        </span>
      </div>
    </div>
  );
}
