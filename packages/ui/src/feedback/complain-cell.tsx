import type { BookingStatus } from '@platform/contracts';
import { Cell } from '../components';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';

// A complaint is about a ride: a confirmed or a finished booking (docs/17).
export const canComplain = (status: BookingStatus) => status === 'confirmed' || status === 'completed';

// "Shikoyat qilish" under a booking, for its passenger and its driver.
export function ComplainCell({ onClick }: { readonly onClick: () => void }) {
  const { t } = useI18n();
  return (
    <Cell before={<IconTile name="complaints" tone="accent" />} onClick={onClick}>
      {t('complaints.open')}
    </Cell>
  );
}
