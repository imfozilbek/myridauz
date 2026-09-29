import { STARS } from '@platform/contracts';
import { Caption } from '@telegram-apps/telegram-ui';
import { useBrand } from '../context/brand-context';
import { Icon } from '../icons';
import './feedback.css';

const BIG_STAR = 36;
const SMALL_STAR = 14;

type Props = { readonly value: number; readonly onChange: (stars: number) => void };

// 1 … 5: a star is filled up to the chosen one; each star has its number under it (docs/19).
export function StarsRow({ value, onChange }: Props) {
  const { colors } = useBrand().theme;
  return (
    <div className="stars-row">
      {STARS.map((stars) => (
        <button key={stars} type="button" aria-pressed={stars === value} onClick={() => onChange(stars)}>
          <Icon
            name="star"
            size={BIG_STAR}
            filled={stars <= value}
            color={stars <= value ? colors.accent : colors.textMuted}
          />
          <Caption>{stars}</Caption>
        </button>
      ))}
    </div>
  );
}

// The stars of one review: filled as many as given.
export function ReviewStars({ stars }: { readonly stars: number }) {
  const { colors } = useBrand().theme;
  return (
    <span className="review-stars" aria-label={String(stars)}>
      {STARS.map((value) => (
        <Icon
          key={value}
          name="star"
          size={SMALL_STAR}
          filled={value <= stars}
          color={value <= stars ? colors.accent : colors.textMuted}
        />
      ))}
    </span>
  );
}
