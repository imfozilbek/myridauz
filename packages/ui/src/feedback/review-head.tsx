import { formatPlate, type Booking, type ReviewTarget } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { PersonBadge } from '../find/person-badge';

const PHOTO = 40;

// Whom the person rates (mockup g60/5): the face, the name; for a driver «Cobalt, Oq · 01 A 123 BC»
// while the plate is still open (docs/129).
export function ReviewHead({
  target,
  booking,
}: {
  readonly target: ReviewTarget;
  readonly booking: Booking | null;
}) {
  const { t } = useI18n();
  const driver = booking?.trip.driver;
  const car =
    target.rateeRole === 'driver' && driver
      ? [
          `${driver.car.model}, ${t(`drivers.color.${driver.car.color}`)}`,
          ...(booking?.plate ? [formatPlate(booking.plate)] : []),
        ]
      : [];
  return (
    <div className="review-head">
      <PersonBadge
        id={target.rateeId}
        name={target.rateeName}
        hasAvatar={driver?.hasAvatar ?? false}
        size={PHOTO}
        plain
      />
      <span className="review-head-text">
        <b>{target.rateeName}</b>
        {car.length > 0 ? <span>{car.join(' · ')}</span> : null}
      </span>
    </div>
  );
}
