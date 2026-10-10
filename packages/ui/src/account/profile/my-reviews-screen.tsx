import type { PersonId } from '@platform/contracts';
import { useApiClients } from '../../context/api-clients';
import { useI18n } from '../../context/i18n-context';
import { ReviewsScreen } from '../../find/reviews-screen';
import { useLoad } from '../../market/use-list';
import { Screen } from '../../screen/screen';
import { EmptyState } from '../../states/empty-state';
import { ErrorScreen } from '../../states/error-screen';
import { ScreenSkeleton } from '../../states/screen-skeleton';

// «Baholarim» of «Profil» (G65, mockup g65/3): every published review of the person (docs/24).
export function MyReviewsScreen({
  userId,
  onBack,
}: {
  readonly userId: PersonId;
  readonly onBack: () => void;
}) {
  const { t } = useI18n();
  const { feedback } = useApiClients();
  const { value, failed, reload } = useLoad(() => feedback.reviewsOf(userId));
  if (failed) return <ErrorScreen onRetry={reload} onBack={onBack} />;
  if (!value) return <ScreenSkeleton onBack={onBack} />;
  if (value.reviews.length > 0) return <ReviewsScreen reviews={value} onBack={onBack} />;
  return (
    <div className="market">
      <Screen onBack={onBack} />
      <EmptyState icon="star" title={t('reviews.empty')} />
    </div>
  );
}
