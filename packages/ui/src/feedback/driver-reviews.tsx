import type { Review, PersonId } from '@platform/contracts';
import { useEffect, useState } from 'react';
import { Cell, Section } from '../components';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { ReviewStars } from './stars-row';

// The newest shown under the driver of a trip; the rest wait for the profile (docs/24).
const SHOWN = 3;

// Published reviews of a person: nothing while loading, nothing without reviews.
export function PersonReviews({ userId }: { readonly userId: PersonId }) {
  const { t } = useI18n();
  const { feedback } = useApiClients();
  const [reviews, setReviews] = useState<readonly Review[]>([]);
  useEffect(() => {
    let live = true;
    feedback
      .reviewsOf(userId)
      .then((found) => live && setReviews(found.reviews.slice(0, SHOWN)))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [feedback, userId]);
  if (reviews.length === 0) return null;
  return (
    <Section header={t('reviews.list')}>
      {reviews.map((review) => (
        <Cell
          key={review.id}
          subtitle={review.text || undefined}
          after={<ReviewStars stars={review.stars} />}
        >
          {review.authorName}
        </Cell>
      ))}
    </Section>
  );
}
