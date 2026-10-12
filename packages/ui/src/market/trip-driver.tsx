import type { Trip } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { ManageGroup, ManageRow } from '../manage/manage-page';

// The driver of a trip for the team: the car and the rating under the name, a tap opens the card of
// the person (docs/24, G78 sheet 4).
export function TripDriver({ trip, onOpen }: { readonly trip: Trip; readonly onOpen: () => void }) {
  const { t, formatRating } = useI18n();
  const { driver } = trip;
  const car = `${driver.car.make} ${driver.car.model}, ${t(`drivers.color.${driver.car.color}`)}`;
  const rating =
    driver.rating.average === null
      ? t('reviews.new')
      : t('find.stars', {
          rating: t('reviews.rating', {
            average: formatRating(driver.rating.average),
            count: driver.rating.count,
          }),
        });
  return (
    <ManageGroup title={t('market.trip.driver')}>
      <ManageRow
        icon="car"
        title={driver.firstName}
        hint={t('home.meta', { when: car, more: rating })}
        onClick={onOpen}
      />
    </ManageGroup>
  );
}
