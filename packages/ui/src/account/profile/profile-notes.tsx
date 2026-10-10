import type { Standing } from '@platform/contracts';
import type { CSSProperties } from 'react';
import { useApiClients } from '../../context/api-clients';
import { useBrand } from '../../context/brand-context';
import { useI18n } from '../../context/i18n-context';
import { useLoad } from '../../market/use-list';
import '../../home/home-note.css';

const TINT = '10%';

// What the bot said once stays in «Profil» (G75, docs/158 З): a warning of the team with its day,
// out of the search while complaints wait, a rating below the line of the brand (docs/24).
export function ProfileNotes({ standing }: { readonly standing: Standing | null }) {
  const { t, formatShortDate, formatRating } = useI18n();
  const { feedback } = useApiClients();
  const { theme, ratings } = useBrand();
  const { value: notes } = useLoad(() => feedback.notes());
  const rating = standing?.rating;
  const low =
    rating &&
    rating.average !== null &&
    rating.count >= ratings.lowCount &&
    rating.average < ratings.lowAverage;
  const lines = [
    ...(notes?.warnedAt
      ? [
          [
            t('account.notes.warned', { date: formatShortDate(new Date(notes.warnedAt)) }),
            t('account.notes.warnedHint'),
          ],
        ]
      : []),
    ...(notes?.hidden ? [[t('account.notes.hidden'), null]] : []),
    ...(low && rating.average !== null
      ? [
          [
            t('account.notes.low', {
              average: formatRating(rating.average),
              line: formatRating(ratings.lowAverage),
            }),
            null,
          ],
        ]
      : []),
  ] as const;
  if (lines.length === 0) return null;
  const { colors } = theme;
  const style = {
    '--note': colors.accentDeep,
    '--note-soft': `color-mix(in srgb, ${colors.accent} ${TINT}, ${colors.bg})`,
  } as CSSProperties;
  return (
    <div className="profile-notes">
      {lines.map(([title, hint]) => (
        <div key={title} className="home-note" style={style}>
          <div>
            <span className="home-note-title">{title}</span>
            {hint ? <span> {hint}</span> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
