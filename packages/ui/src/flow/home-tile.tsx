import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { IconTile, type Tone } from '../icon-tile';
import type { IconName } from '../icons';
import type { TileLive } from './start-action';

type Props = TileLive & {
  readonly icon: IconName;
  readonly tone: Tone;
  readonly title: string;
  // Across both columns: a lone last tile or a row of the admin Mini App (G53).
  readonly wide?: boolean;
  // A driver waits for the approval: the icon is muted, the tile still opens and explains (docs/86 V7).
  readonly waiting?: boolean;
  readonly onClick: () => void;
};

// One tile of the main screen (owner decision 04.10.2026, G53): an icon, a title and a short hint,
// a red-free badge for what waits for the person, or a big number of the day.
export function HomeTile(props: Props) {
  const { icon, tone, title, hint, badge, value, urgent, wide, waiting, onClick } = props;
  const { formatNumber } = useI18n();
  const { colors } = useBrand().theme;
  const shown = badge && badge > 0 ? Math.min(badge, MAX_BADGE) : 0;
  return (
    <button type="button" className="home-tile" data-wide={wide ? '' : undefined} onClick={onClick}>
      <span className={waiting ? 'action-waiting' : undefined}>
        <IconTile name={icon} tone={tone} size="tile" />
      </span>
      {shown > 0 ? (
        <span className="home-tile-badge" style={{ background: colors.accentStrong, color: colors.bg }}>
          {shown === MAX_BADGE ? `${MAX_BADGE}+` : formatNumber(shown)}
        </span>
      ) : null}
      <span className="home-tile-title">{title}</span>
      {value === undefined ? null : (
        <span className="home-tile-value" style={urgent ? { color: colors.danger } : undefined}>
          {formatNumber(value)}
        </span>
      )}
      {hint ? <span className="home-tile-hint">{hint}</span> : null}
    </button>
  );
}

const MAX_BADGE = 99;
