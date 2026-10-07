import type { PersonId, UserReviews } from '@platform/contracts';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { useLoad } from '../market/use-list';

type Props = { readonly driverId: PersonId; readonly onAll: (reviews: UserReviews) => void };

// One review of the driver and «Barcha izohlar (N) ›» (docs/118 path 2): the newest with words.
// Nothing while loading and nothing without reviews (docs/24).
export function ReviewCard({ driverId, onAll }: Props) {
  const { t } = useI18n();
  const { feedback } = useApiClients();
  const { value } = useLoad(() => feedback.reviewsOf(driverId));
  const shown = value?.reviews.find((review) => review.text !== '') ?? value?.reviews[0];
  if (!value || !shown) return null;
  return (
    <div className="safar-card review-card">
      {shown.text ? <p className="review-card-text">{t('find.quote', { text: shown.text })}</p> : null}
      <p className="review-card-meta">
        {t('find.reviewBy', { stars: t('find.star').repeat(shown.stars), name: shown.authorName })}{' '}
        <button type="button" className="find-link" onClick={() => onAll(value)}>
          {t('find.allReviews', { count: String(value.rating.count) })}
        </button>
      </p>
    </div>
  );
}
