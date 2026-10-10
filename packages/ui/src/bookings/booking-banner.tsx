import { tashkentDate, type Booking } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { useDayLabel } from '../market/when';
import { OutcomePlate } from '../states/outcome-plate';
import { useBookingEnds } from '../trip/booking-ends';
import { useDoneLine } from '../trip/done-line';

// The plate on top of a booking page (docs/118 path 3, docs/124 A): what happened and when.
// «Joy tasdiqlandi» and «Safar tugadi» in the colour of the app, an end without a trip in grey; a
// month after the trip grey with its tick (g60/6).
export function BookingBanner({ booking }: { readonly booking: Booking }) {
  const { t, formatTime } = useI18n();
  const dayLabel = useDayLabel();
  const { status } = booking;
  const { departAt } = booking.trip;
  const { end } = useBookingEnds(booking);
  const done = useDoneLine(booking.trip, end);
  const why = useWhy(booking);
  // A month after the trip the plate is grey: only the district and the reading are left (g60/6).
  const old = status === 'completed' && done.old;
  const good = (status === 'confirmed' || status === 'completed') && !old;
  const title =
    status === 'confirmed'
      ? t('bookings.confirmed.title')
      : status === 'completed'
        ? t('bookings.done.title')
        : t(`bookings.status.${status}`);
  const when =
    status === 'completed'
      ? done.line
      : t('bookings.confirmed.when', {
          day: dayLabel(tashkentDate(departAt), Date.now()),
          time: formatTime(new Date(departAt)),
        });
  return <OutcomePlate tick={good || old} off={!good} title={title} lines={why ? [when, why] : [when]} />;
}

const ENDED = ['declined', 'expired', 'cancelled_by_driver', 'cancelled_by_passenger'] as const;
type Ended = (typeof ENDED)[number];
// A seat that ended without a trip (docs/124 А): the next step is the trips of the same route.
export const endedBadly = (status: Booking['status']): status is Ended =>
  ENDED.some((each) => each === status);

// Why it ended, or how the driver moved the time of a seat that stays (docs/124 А, Б).
function useWhy({ status, trip }: Booking): string | null {
  const { t, formatTime } = useI18n();
  // The driver cancelled one seat, not the trip: said so (G75, docs/158 А).
  if (status === 'cancelled_by_driver' && trip.status !== 'cancelled') return t('bookings.why.seatCancelled');
  if (endedBadly(status)) return t(`bookings.why.${status}`);
  if (status !== 'confirmed' || trip.firstDepartAt === trip.departAt) return null;
  const time = (ms: number) => formatTime(new Date(ms));
  return t('bookings.moved', { from: time(trip.firstDepartAt), to: time(trip.departAt) });
}
