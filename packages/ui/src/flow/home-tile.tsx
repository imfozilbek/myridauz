import type { BrandColors } from '@platform/brands';
import type { CSSProperties } from 'react';
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
  // Waits for the approval of the application: grey, it still opens and explains (G62).
  readonly pale?: boolean;
  // Needs the person now: light red in a red line, the hint red (G66, «Hamyon» below 5 seats).
  readonly alarm?: boolean;
};

// One tile of the main screen (owner decision 04.10.2026, G53): an icon, a title and a short hint,
// a red-free badge for what waits for the person, or a big number of the day.
export function HomeTile(props: Props) {
  const { icon, tone, title, hint, badge, value, urgent, onClick, pale = false, alarm = false } = props;
  const { formatNumber } = useI18n();
  const { colors } = useBrand().theme;
  const shown = badge && badge > 0 ? Math.min(badge, MAX_BADGE) : 0;
  return (
    <button
      type="button"
      className={['home-tile', pale ? 'home-tile-pale' : '', alarm ? 'home-tile-alarm' : ''].join(' ').trim()}
      style={alarm ? alarmColors(colors) : undefined}
      onClick={onClick}
    >
      <IconTile name={icon} tone={tone} size="tile" soft />
      {shown > 0 ? (
        <span className="home-tile-badge" style={{ background: colors.badge, color: colors.bg }}>
          {shown === MAX_BADGE ? `${MAX_BADGE}+` : formatNumber(shown)}
        </span>
      ) : null}
      <span className="home-tile-text">
        <span className="home-tile-title">{title}</span>
        {value === undefined ? null : (
          <span className="home-tile-value" style={urgent ? { color: colors.dangerText } : undefined}>
            {formatNumber(value)}
          </span>
        )}
        {hint ? <span className="home-tile-hint">{hint}</span> : null}
      </span>
    </button>
  );
}

const MAX_BADGE = 99;

const alarmColors = (colors: BrandColors) =>
  ({
    '--tile-alarm': colors.dangerSoft,
    '--tile-alarm-line': colors.dangerLine,
    '--tile-alarm-ink': colors.dangerText,
  }) as CSSProperties;
