import type { Booking } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { useBookingEnds } from '../trip/booking-ends';

// «Chilonzor bozori · +2 km» under a name on «Mening safarim» (mockup g63/3): where the person is
// taken and the way the driver adds for them; a request also says its commission (journey screen 6).
export function useRiderLine(booking: Booking, withCommission: boolean): string {
  const { t, formatNumber } = useI18n();
  const { start } = useBookingEnds(booking);
  const extra = booking.extraKm ? t('way.driver.extra', { km: String(booking.extraKm) }) : null;
  const commission = withCommission
    ? t('driverTrip.commission', { amount: formatNumber(booking.commission) })
    : null;
  return [start, extra, commission].filter((part) => part !== null).join(' · ');
}

// «★ 4,8», or «Yangi» while the passenger has few ratings (docs/24); nothing from an old server.
export function useRiderStars({ passenger }: Booking): string | null {
  const { t, formatRating } = useI18n();
  if (!passenger.rating) return null;
  const { average } = passenger.rating;
  return average === null ? t('reviews.new') : t('find.stars', { rating: formatRating(average) });
}
