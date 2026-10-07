import type { Rating } from '@platform/contracts';
import { Caption } from '@telegram-apps/telegram-ui';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import './feedback.css';

const STAR_SIZE = 14;

// "⭐ 4,8 (37)", or "Yangi" below 3 ratings (docs/24).
export function RatingBadge({ rating }: { readonly rating: Rating }) {
  const { t, formatRating } = useI18n();
  const { colors } = useBrand().theme;
  return (
    <Caption className="rating-badge">
      <Icon name="star" size={STAR_SIZE} color={colors.accent} filled />
      {rating.average === null
        ? t('reviews.new')
        : t('reviews.rating', { average: formatRating(rating.average), count: rating.count })}
    </Caption>
  );
}
