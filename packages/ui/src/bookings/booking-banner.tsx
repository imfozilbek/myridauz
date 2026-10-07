import { afterTrip, arrivalAt, DAY_MS, tashkentDate, type Booking } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { useDayLabel } from '../market/when';
import { useBookingEnds } from '../trip/booking-ends';

// The plate on top of a booking page (docs/118 path 3, docs/124 A): what happened and when.
// «Joy tasdiqlandi» and «Safar tugadi» in the colour of the app, an end without a trip in grey.
export function BookingBanner({ booking }: { readonly booking: Booking }) {
  const { t, formatTime } = useI18n();
  const dayLabel = useDayLabel();
  const { status } = booking;
  const { departAt } = booking.trip;
  const done = useDoneLine(booking);
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
          {status === 'completed'
            ? done
            : t('bookings.confirmed.when', {
                day: dayLabel(tashkentDate(departAt), Date.now()),
                time: formatTime(new Date(departAt)),
              })}
        </span>
      </span>
    </div>
  );
}

// After the trip: when and where it ended; a month later, how long ago (mockups g60/6, g60/7).
function useDoneLine(booking: Booking): string {
  const { t, formatDate, formatTime } = useI18n();
  const { end } = useBookingEnds(booking);
  const { departAt, km } = booking.trip;
  const arrival = new Date(arrivalAt(departAt, km));
  const now = Date.now();
  if (now < afterTrip(departAt, km).complainUntil)
    return t('bookings.done.when', { date: formatDate(arrival), time: formatTime(arrival), place: end });
  const days = Math.floor((now - arrival.getTime()) / DAY_MS);
  return t('bookings.done.ago', { date: formatDate(arrival), days });
}
