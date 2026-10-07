import type { UserReviews } from '@platform/contracts';
import { Cell, List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { ReviewStars } from '../feedback/stars-row';
import { Screen } from '../screen/screen';
import { useScreenBackground } from '../telegram/screen-background';

// «Barcha izohlar»: every published review of the driver (docs/24), the newest first.
export function ReviewsScreen({
  reviews,
  onBack,
}: {
  readonly reviews: UserReviews;
  readonly onBack: () => void;
}) {
  useScreenView('market.reviews');
  useScreenBackground();
  const { t } = useI18n();
  return (
    <List>
      <Screen onBack={onBack} />
      <Section header={t('reviews.list')}>
        {reviews.reviews.map((review) => (
          <Cell
            key={review.id}
            subtitle={review.text || undefined}
            after={<ReviewStars stars={review.stars} />}
          >
            {review.authorName}
          </Cell>
        ))}
      </Section>
    </List>
  );
}
