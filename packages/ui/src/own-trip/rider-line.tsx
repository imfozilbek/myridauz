import type { Booking, Rating } from '@platform/contracts';
import { Fragment } from 'react';
import { useI18n } from '../context/i18n-context';
import { useBookingEnds } from '../trip/booking-ends';

type Props = {
  readonly booking: Booking;
  // A request also says its commission (journey screen 6); a confirmed passenger does not.
  readonly withCommission: boolean;
  readonly className: string;
};

// «Chilonzor bozori · +2 km» under a name on «Mening safarim» (mockup g63/3): where the person is
// taken and the way the driver adds for them. Each part stays whole: a narrow phone breaks the line
// only after «·», never between «komissiya» and its sum (docs/121).
export function RiderLine({ booking, withCommission, className }: Props) {
  const { t, formatNumber } = useI18n();
  const { start } = useBookingEnds(booking);
  const extra = booking.extraKm ? t('way.driver.extra', { km: String(booking.extraKm) }) : null;
  const commission = withCommission
    ? t('driverTrip.commission', { amount: formatNumber(booking.commission) })
    : null;
  const parts = [start, extra, commission].filter((part) => part !== null);
  return (
    <span className={className}>
      {parts.map((part, index) => (
        <Fragment key={part}>
          {index > 0 ? ' ' : null}
          <span className="line-part">{index < parts.length - 1 ? `${part} ·` : part}</span>
        </Fragment>
      ))}
    </span>
  );
}

// «★ 4,8», or «Yangi» while the passenger has few ratings (docs/24); nothing from an old server. A
// booking and a request (G64) name the passenger the same way.
type Rider = { readonly passenger: { readonly rating?: Rating | undefined } };
export function useRiderStars({ passenger }: Rider): string | null {
  const { t, formatRating } = useI18n();
  if (!passenger.rating) return null;
  const { average } = passenger.rating;
  return average === null ? t('reviews.new') : t('find.stars', { rating: formatRating(average) });
}
