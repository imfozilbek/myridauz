import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { IconTile, type Tone } from '../icon-tile';
import type { IconName } from '../icons';
import type { TileLive } from './start-action';

type Props = TileLive & {
  readonly icon: IconName;
  readonly tone: Tone;
  readonly title: string;
  readonly onClick: () => void;
};

// One tile of the main screen (owner decision 04.10.2026, G53): an icon, a title and a short hint,
// a red-free badge for what waits for the person, or a big number of the day.
export function HomeTile(props: Props) {
  const { icon, tone, title, hint, badge, value, urgent, onClick } = props;
  const { formatNumber } = useI18n();
  const { colors } = useBrand().theme;
  const shown = badge && badge > 0 ? Math.min(badge, MAX_BADGE) : 0;
  return (
    <button type="button" className="home-tile" onClick={onClick}>
      <IconTile name={icon} tone={tone} size="tile" soft />
      {shown > 0 ? (
        <span className="home-tile-badge" style={{ background: colors.accentStrong, color: colors.bg }}>
          {shown === MAX_BADGE ? `${MAX_BADGE}+` : formatNumber(shown)}
        </span>
      ) : null}
      <span className="home-tile-text">
        <span className="home-tile-title">{title}</span>
        {value === undefined ? null : (
          <span className="home-tile-value" style={urgent ? { color: colors.danger } : undefined}>
            {formatNumber(value)}
          </span>
        )}
        {hint ? <span className="home-tile-hint">{hint}</span> : null}
      </span>
    </button>
  );
}

const MAX_BADGE = 99;
