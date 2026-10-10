import type { Trip } from '@platform/contracts';
import { ProfilePhoto } from '../account/profile/profile-photo';
import { Cell, Section } from '../components';
import { useI18n } from '../context/i18n-context';
import { PersonReviews } from '../feedback/driver-reviews';
import { RatingBadge } from '../feedback/rating-badge';

const PHOTO_SIZE = 56;

// The driver of a trip for the team: the face, the car, the rating and the reviews (docs/24).
export function TripDriver({ trip }: { readonly trip: Trip }) {
  const { t } = useI18n();
  const { driver } = trip;
  return (
    <>
      <Section header={t('market.trip.driver')}>
        <Cell
          before={
            <ProfilePhoto
              userId={driver.id}
              name={driver.firstName}
              hasAvatar={driver.hasAvatar}
              size={PHOTO_SIZE}
            />
          }
          subtitle={`${driver.car.make} ${driver.car.model}, ${t(`drivers.color.${driver.car.color}`)}`}
          after={<RatingBadge rating={driver.rating} />}
        >
          {driver.firstName}
        </Cell>
      </Section>
      <PersonReviews key={driver.id} userId={driver.id} />
    </>
  );
}
