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
  const why = useWhy(booking);
  // A month after the trip the plate is grey: only the district and the reading are left (g60/6).
  const { departAt: at, km } = booking.trip;
  const old = status === 'completed' && Date.now() >= afterTrip(at, km).pointsUntil;
  const good = (status === 'confirmed' || status === 'completed') && !old;
  const title =
    status === 'confirmed'
      ? t('bookings.confirmed.title')
      : status === 'completed'
        ? t('bookings.done.title')
        : t(`bookings.status.${status}`);
  return (
    <div className={good ? 'booking-banner' : 'booking-banner booking-banner-off'}>
      <span className="booking-banner-tile">
        <Icon name={good || old ? 'selected' : 'close'} size={22} />
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
        {why ? <span>{why}</span> : null}
      </span>
    </div>
  );
}

const ENDED = ['declined', 'expired', 'cancelled_by_driver', 'cancelled_by_passenger'] as const;
type Ended = (typeof ENDED)[number];
// A seat that ended without a trip (docs/124 А): the next step is the trips of the same route.
export const endedBadly = (status: Booking['status']): status is Ended =>
  ENDED.some((each) => each === status);

// Why it ended, or how the driver moved the time of a seat that stays (docs/124 А, Б).
function useWhy({ status, trip }: Booking): string | null {
  const { t, formatTime } = useI18n();
  if (endedBadly(status)) return t(`bookings.why.${status}`);
  if (status !== 'confirmed' || trip.firstDepartAt === trip.departAt) return null;
  const time = (ms: number) => formatTime(new Date(ms));
  return t('bookings.moved', { from: time(trip.firstDepartAt), to: time(trip.departAt) });
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
