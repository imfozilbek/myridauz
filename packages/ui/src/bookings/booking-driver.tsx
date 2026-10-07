import type { Booking } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { PersonBadge } from '../find/person-badge';
import { PlateBadge } from '../find/plate-badge';

const PHOTO = 50;

// The driver of a booking (mockup g60/1): the face, the name with the rating, the car and the plate.
// The plate shows only while the booking is open (docs/07, docs/129).
export function BookingDriver({ booking }: { readonly booking: Booking }) {
  const { t, formatNumber } = useI18n();
  const { driver } = booking.trip;
  return (
    <div className="booking-driver">
      <PersonBadge id={driver.id} name={driver.firstName} hasAvatar={driver.hasAvatar} size={PHOTO} />
      <span className="booking-driver-text">
        <span className="booking-driver-name">
          {driver.firstName}
          {driver.rating.average === null ? null : (
            <span className="booking-driver-rating">
              {t('find.stars', { rating: formatNumber(driver.rating.average) })}
            </span>
          )}
        </span>
        <span className="booking-driver-car">
          {t('find.car', {
            make: driver.car.make,
            model: driver.car.model,
            color: t(`drivers.color.${driver.car.color}`),
          })}
        </span>
        {booking.plate ? <PlateBadge plate={booking.plate} /> : null}
      </span>
    </div>
  );
}
