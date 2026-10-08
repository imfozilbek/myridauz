import type { Booking } from '@platform/contracts';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { brandVars } from '../theme/brand-vars';
import { refundWaits } from './no-show-text';
import './no-show.css';

// On top of «Mening safarim» after «Kelmadi» (docs/129, mockup g63/5 phone 1): the refund of the
// commission went to the team and waits for the owner (docs/35).
export function NoShowBanners({ bookings }: { readonly bookings: readonly Booking[] }) {
  const { t, formatNumber } = useI18n();
  // The colours of the app on the plate itself: it stands on any page of the trip.
  const style = brandVars(useBrand().theme.colors);
  return bookings.filter(refundWaits).map((booking) => (
    <div key={booking.id} className="no-show-banner" role="status" style={style}>
      <Icon name="selected" size={16} />
      <span className="no-show-banner-text">
        <b>{t('driverAfter.noShow.title', { name: booking.passenger.firstName })}</b>
        <span>
          {t('driverAfter.noShow.sent', {
            amount: formatNumber(booking.refund?.amount ?? booking.commission),
          })}
        </span>
      </span>
    </div>
  ));
}
