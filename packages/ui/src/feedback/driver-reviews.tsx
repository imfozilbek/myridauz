import type { PersonId } from '@platform/contracts';
import { Cell, Section } from '../components';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { useLoad } from '../market/use-list';
import { ReviewStars } from './stars-row';

// The newest shown under the driver of a trip; the rest wait for the profile (docs/24).
const SHOWN = 3;

// Published reviews of a person: nothing while loading, nothing without reviews. A failed load
// offers one more try, and the network coming back loads them by itself (G43, docs/65 B3).
export function PersonReviews({ userId }: { readonly userId: PersonId }) {
  const { t } = useI18n();
  const { feedback } = useApiClients();
  const { value, failed, reload } = useLoad(() => feedback.reviewsOf(userId));
  if (failed) {
    return (
      <Section header={t('reviews.list')}>
        <Cell before={<Icon name="error" />} onClick={reload}>
          {t('common.retry')}
        </Cell>
      </Section>
    );
  }
  const reviews = value?.reviews.slice(0, SHOWN) ?? [];
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
