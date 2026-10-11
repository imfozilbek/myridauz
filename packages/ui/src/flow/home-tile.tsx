import type { BrandColors } from '@platform/brands';
import type { CSSProperties } from 'react';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { IconTile, type Tone } from '../icon-tile';
import type { IconName } from '../icons';

type Props = {
  readonly icon: IconName;
  readonly tone: Tone;
  readonly title: string;
  readonly hint?: string;
  // How many things wait for the person: a red-free badge (G53).
  readonly badge?: number;
  readonly onClick: () => void;
  // Needs the person now: light red, the hint red (G66, «Hamyon» short of a request).
  readonly alarm?: boolean;
  // Soon needs the person: light amber, the hint amber (G76, «Hamyon» low).
  readonly soon?: boolean;
  // The square tile of the main screens of people: a smaller icon (G76, mockup g76/1).
  readonly square?: boolean;
};

// One tile of the main screen (owner decision 04.10.2026, G53): an icon, a title and a short hint,
// a red-free badge for what waits for the person.
export function HomeTile(props: Props) {
  const { icon, tone, title, hint, badge, onClick, alarm = false } = props;
  const { soon = false, square = false } = props;
  const { formatNumber } = useI18n();
  const { colors } = useBrand().theme;
  const shown = badge && badge > 0 ? Math.min(badge, MAX_BADGE) : 0;
  return (
    <button
      type="button"
      className={classes(alarm, soon)}
      style={alarm || soon ? alarmColors(colors) : undefined}
      onClick={onClick}
    >
      <IconTile name={icon} tone={tone} size={square ? 'home' : 'tile'} soft />
      {shown > 0 || (alarm && square) ? (
        <span className="home-tile-badge" style={{ background: colors.badge, color: colors.bg }}>
          {/* A square tile that needs the person now says «!» (G76, mockup g76/3 state 8). */}
          {shown === 0 ? ALARM_MARK : shown === MAX_BADGE ? `${MAX_BADGE}+` : formatNumber(shown)}
        </span>
      ) : null}
      <span className="home-tile-text">
        <span className="home-tile-title">{title}</span>
        {hint ? <span className="home-tile-hint">{hint}</span> : null}
      </span>
    </button>
  );
}

const MAX_BADGE = 99;
const ALARM_MARK = '!';

const classes = (alarm: boolean, soon: boolean) =>
  ['home-tile', alarm ? 'home-tile-alarm' : '', soon ? 'home-tile-soon' : ''].filter(Boolean).join(' ');

const alarmColors = (colors: BrandColors) =>
  ({
    '--tile-alarm': colors.dangerTile,
    '--tile-alarm-ink': colors.dangerText,
    '--tile-soon': colors.attentionSoft,
    '--tile-soon-ink': colors.soonInk,
  }) as CSSProperties;
