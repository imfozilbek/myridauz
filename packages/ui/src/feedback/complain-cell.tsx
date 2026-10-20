import { afterTrip, type Booking } from '@platform/contracts';
import { Cell } from '../components';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';

// A complaint is about a ride: a confirmed or a finished booking (docs/17), until its days pass;
// later it goes through «Yordam» (docs/129, G89 U1), as the server says.
export function useCanComplain() {
  const brand = useBrand();
  return (booking: Booking) =>
    (booking.status === 'confirmed' || booking.status === 'completed') &&
    Date.now() < afterTrip(brand, booking.trip.departAt, booking.trip.km).complainUntil;
}

// "Shikoyat qilish" under a booking, for its passenger and its driver.
export function ComplainCell({ onClick }: { readonly onClick: () => void }) {
  const { t } = useI18n();
  return (
    <Cell before={<IconTile name="complaints" tone="accent" />} onClick={onClick}>
      {t('complaints.open')}
    </Cell>
  );
}
