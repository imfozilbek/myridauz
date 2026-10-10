import type { UserReviews } from '@platform/contracts';
import { Title } from '@telegram-apps/telegram-ui';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { ReviewStars } from '../feedback/stars-row';
import { RowCard } from '../mine/row-card';
import { Screen } from '../screen/screen';
import { useScreenBackground } from '../telegram/screen-background';
import '../market/market.css';

// «Barcha izohlar» and «Baholarim»: every published review (docs/24), the newest first, each on its
// own card as the lists of the mockup g75/2 A; the stars on the right.
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
    <div className="market">
      <Screen onBack={onBack} />
      <Title weight="1" className="market-title">
        {t('reviews.list')}
      </Title>
      {reviews.reviews.map((review) => (
        <RowCard
          key={review.id}
          icon="star"
          title={review.authorName}
          hint={review.text || undefined}
          after={<ReviewStars stars={review.stars} />}
        />
      ))}
    </div>
  );
}
