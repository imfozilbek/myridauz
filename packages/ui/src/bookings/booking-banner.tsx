import { tashkentDate, type Booking } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { useDayLabel } from '../market/when';

// The plate on top of a booking page (docs/118 path 3, docs/124 A): what happened and when.
// «Joy tasdiqlandi» and «Safar tugadi» in the colour of the app, an end without a trip in grey.
export function BookingBanner({ booking }: { readonly booking: Booking }) {
  const { t, formatTime } = useI18n();
  const dayLabel = useDayLabel();
  const { status } = booking;
  const { departAt } = booking.trip;
  const good = status === 'confirmed' || status === 'completed';
  const title =
    status === 'confirmed'
      ? t('bookings.confirmed.title')
      : status === 'completed'
        ? t('bookings.done.title')
        : t(`bookings.status.${status}`);
  return (
    <div className={good ? 'booking-banner' : 'booking-banner booking-banner-off'}>
      <span className="booking-banner-tile">
        <Icon name={good ? 'selected' : 'close'} size={22} />
      </span>
      <span className="booking-banner-text">
        <b>{title}</b>
        <span>
          {t('bookings.confirmed.when', {
            day: dayLabel(tashkentDate(departAt), Date.now()),
            time: formatTime(new Date(departAt)),
          })}
        </span>
      </span>
    </div>
  );
}
