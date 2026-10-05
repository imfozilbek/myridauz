import './network.css';
import { Cell } from '../cell';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';
import { useOnline } from './online';

// Without a network the screen stays as it was and says why nothing new comes (G43). When the
// network is back the banner goes and the screens refresh themselves (onAppVisible).
export function OfflineBanner() {
  const online = useOnline();
  const { t } = useI18n();
  if (online) return null;
  return (
    <div role="status" className="offline-banner">
      <Cell before={<IconTile name="offline" tone="danger" />} subtitle={t('common.offlineHint')}>
        {t('common.offline')}
      </Cell>
    </div>
  );
}
