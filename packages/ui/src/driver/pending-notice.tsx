import { Cell, Section } from '../components';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';
import { usePending } from './driver-context';

// On the main screen while the application is checked: the driver knows why some things wait.
export function PendingNotice() {
  const { t } = useI18n();
  if (!usePending()) return null;
  return (
    <Section>
      <Cell
        before={<IconTile name="applications" tone="accent" />}
        subtitle={t('drivers.status.pending.explore')}
      >
        {t('drivers.status.pending.title')}
      </Cell>
    </Section>
  );
}
