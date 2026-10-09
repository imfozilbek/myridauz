import type { Standing } from '@platform/contracts';
import { useI18n } from '../../context/i18n-context';

// The tiles keep their height while the numbers load: nothing jumps (G41).
const BLANK = '\u00a0';

// The three numbers under the card (G65, mockup g65/3): the rating, the trips that are over and how
// often others marked the person «Vaqtida». A new rating says «Yangi», as everywhere (docs/24).
export function ProfileStats({ standing }: { readonly standing: Standing | null }) {
  const { t, formatRating } = useI18n();
  const fresh = t('account.profile.newRating');
  const average = standing?.rating.average ?? null;
  const onTime = standing?.onTime ?? null;
  const tiles = [
    [
      average === null ? fresh : t('find.stars', { rating: formatRating(average) }),
      t('account.profile.stats.reviews', { count: String(standing?.rating.count ?? 0) }),
    ],
    [String(standing?.trips ?? 0), t('account.profile.stats.trips')],
    [
      onTime === null ? fresh : t('account.profile.stats.percent', { value: String(onTime) }),
      t('account.profile.stats.onTime'),
    ],
  ] as const;
  return (
    <div className="profile-stats" aria-busy={standing === null}>
      {tiles.map(([value, label]) => (
        <span key={label} className="profile-stat">
          <b>{standing ? value : BLANK}</b>
          <span>{label}</span>
        </span>
      ))}
    </div>
  );
}
