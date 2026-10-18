import type { PersonId, UserReviews } from '@platform/contracts';
import { Button, Title } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { ReviewStars } from '../feedback/stars-row';
import { RowCard } from '../mine/row-card';
import { Screen } from '../screen/screen';
import { useScreenBackground } from '../telegram/screen-background';
import '../market/market.css';

type Review = UserReviews['reviews'][number];

// «Barcha izohlar» and «Baholarim»: every published review (docs/24), the newest first, each on its
// own card as the lists of the mockup g75/2 A; the stars on the right, the day under the name.
// «Yana koʻrsatish» brings the older ones (G46).
export function ReviewsScreen({
  userId,
  reviews,
  onBack,
}: {
  readonly userId: PersonId;
  readonly reviews: UserReviews;
  readonly onBack: () => void;
}) {
  useScreenView('market.reviews');
  useScreenBackground();
  const { t, formatDate } = useI18n();
  const { feedback } = useApiClients();
  const [older, setOlder] = useState<readonly Review[]>([]);
  const [more, setMore] = useState(reviews.more);
  const shown = [...reviews.reviews, ...older];
  const loadMore = async () => {
    const last = shown.at(-1);
    if (!last) return;
    const next = await feedback.reviewsOf(userId, last.at);
    setOlder((list) => [...list, ...next.reviews]);
    setMore(next.more);
  };
  const hint = (review: Review) => {
    const when = formatDate(new Date(review.at));
    return review.text ? t('home.meta', { when, more: review.text }) : when;
  };
  return (
    <div className="market">
      <Screen onBack={onBack} />
      <Title weight="1" className="market-title">
        {t('reviews.list')}
      </Title>
      {shown.map((review) => (
        <RowCard
          key={review.id}
          icon="star"
          title={review.authorName}
          hint={hint(review)}
          after={<ReviewStars stars={review.stars} />}
        />
      ))}
      {more ? (
        <div className="step-note">
          <Button mode="plain" size="m" stretched onClick={() => void loadMore().catch(() => undefined)}>
            {t('market.mine.more')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
