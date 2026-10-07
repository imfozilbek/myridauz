import type { Trip } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { PersonBadge } from './person-badge';
import { PlateBadge } from './plate-badge';

const PHOTO = 60;

// The driver on top of «Safar» (docs/118 path 2, A): the face, the rating, the car and its plate.
// The plate shows before a booking (owner decision 07.10.2026).
export function DriverCard({ trip }: { readonly trip: Trip }) {
  const { t, formatRating } = useI18n();
  const { driver } = trip;
  return (
    <div className="safar-card driver-card">
      <PersonBadge id={driver.id} name={driver.firstName} hasAvatar={driver.hasAvatar} size={PHOTO} />
      <span className="driver-card-text">
        <span className="driver-card-name">
          {driver.firstName}
          {driver.rating.average === null ? null : (
            <span className="driver-card-rating">
              {t('find.stars', { rating: formatRating(driver.rating.average) })}
              <span className="driver-card-count">
                {t('find.count', { count: String(driver.rating.count) })}
              </span>
            </span>
          )}
        </span>
        <span className="driver-card-car">
          {t('find.car', {
            make: driver.car.make,
            model: driver.car.model,
            color: t(`drivers.color.${driver.car.color}`),
          })}
        </span>
        <PlateBadge plate={driver.car.plate} />
      </span>
    </div>
  );
}
