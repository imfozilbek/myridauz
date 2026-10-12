import type { PersonId } from '@platform/contracts';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { ManageGroup, ManageRow } from '../manage/manage-page';
import { useLoad } from '../market/use-list';
import { ReviewStars } from './stars-row';

// The newest shown under the driver of a trip; the rest wait for the profile (docs/24).
const SHOWN = 3;

// Published reviews of a person for the team (G78 sheet 4): nothing while loading, nothing without
// reviews. A failed load offers one more try in red, and the network coming back loads them by
// itself (G43, docs/65 B3).
export function PersonReviews({ userId }: { readonly userId: PersonId }) {
  const { t } = useI18n();
  const { feedback } = useApiClients();
  const { value, failed, reload } = useLoad(() => feedback.reviewsOf(userId));
  if (failed) {
    return (
      <ManageGroup title={t('reviews.list')}>
        <ManageRow icon="error" title={t('common.retry')} danger onClick={reload} />
      </ManageGroup>
    );
  }
  const reviews = value?.reviews.slice(0, SHOWN) ?? [];
  if (reviews.length === 0) return null;
  return (
    <ManageGroup title={t('reviews.list')}>
      {reviews.map((review) => (
        <ManageRow
          key={review.id}
          icon="star"
          title={review.authorName}
          {...(review.text ? { hint: review.text } : {})}
          value={<ReviewStars stars={review.stars} />}
        />
      ))}
    </ManageGroup>
  );
}
