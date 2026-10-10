import { NAVBAT_KINDS, type Navbat } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import type { NavbatFilter } from '../flow/start-action';
import { haptic } from '../telegram/feedback';

type ChipsProps = {
  readonly counts: Navbat['counts'];
  readonly value: NavbatFilter;
  readonly onChange: (filter: NavbatFilter) => void;
};

// The filter of «Navbat» with the numbers in red (docs/120, mockup g67/1): «Hammasi», then each kind
// that waits; the chosen one stays while it empties. One row that scrolls sideways, as on the mockup.
export function NavbatChips({ counts, value, onChange }: ChipsProps) {
  const { t } = useI18n();
  const all = NAVBAT_KINDS.reduce((sum, kind) => sum + counts[kind], 0);
  const kinds = NAVBAT_KINDS.filter((kind) => counts[kind] > 0 || kind === value);
  const chips = [
    { id: 'all' as const, count: all },
    ...kinds.map((kind) => ({ id: kind, count: counts[kind] })),
  ];
  return (
    <div className="navbat-chips" role="radiogroup" aria-label={t('team.section.navbat')}>
      {chips.map(({ id, count }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={id === value}
          className={id === value ? 'navbat-chip navbat-chip-on' : 'navbat-chip'}
          onClick={() => {
            haptic.select();
            onChange(id);
          }}
        >
          {t(`team.filter.${id}`)} <b>{count}</b>
        </button>
      ))}
    </div>
  );
}
