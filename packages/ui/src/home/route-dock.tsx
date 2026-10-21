import type { ReactNode } from 'react';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Icon, type IconName } from '../icons';
import './route-dock.css';
import './route-dock-swap.css';

const SWAP = 16;
const TOOL = 16;

type DockEnd = {
  // The place shown, or null: the gray question takes its line.
  readonly value: string | null;
  readonly placeholder: string;
  // Under the place: how it was found, or how many trips go there.
  readonly hint?: ReactNode;
  readonly onTap: () => void;
  // The «x» that empties a filled end (G79 В4, owner 12.10.2026): both ends of both roles.
  readonly onClear?: (() => void) | undefined;
  // «Joylashuvim» of an empty end: where the person stands (G79 В4, owner 12.10.2026).
  readonly onLocate?: (() => void) | undefined;
};

type Props = { readonly from: DockEnd; readonly to: DockEnd; readonly onSwap: () => void };

// «Qayerdan / Qayerga» in the block at the bottom of the main screen (G66, G76, mockups g66/1,
// g76/1): a tap on an end picks it, ⇅ swaps them.
export function RouteDock({ from, to, onSwap }: Props) {
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  return (
    <div className="home-dock-route">
      <End end={from} label={t('places.from')} ring="home-dock-from" />
      <div className="home-dock-line">
        {/* Two empty ends have nothing to swap (G91 robot). */}
        <button
          type="button"
          className="home-dock-swap"
          aria-label={t('home.dock.swap')}
          disabled={!from.value && !to.value}
          onClick={onSwap}
        >
          <Icon name="swap" size={SWAP} color={colors.routeSwap} />
        </button>
      </div>
      <End end={to} label={t('places.to')} ring="home-dock-to" />
    </div>
  );
}

type EndProps = { readonly end: DockEnd; readonly label: string; readonly ring: string };
type Tool = {
  readonly icon: IconName;
  readonly label: string;
  readonly run: () => void;
  readonly color?: string;
};

// The round tool of an end, over or under ⇅: «x» on a place, «Joylashuvim» on an empty end.
function End({ end, label, ring }: EndProps) {
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  const button = <EndButton end={end} label={label} ring={ring} />;
  const clear = end.value && end.onClear;
  const locate = !end.value && end.onLocate;
  const tool: Tool | null = clear
    ? { icon: 'close', label: t('home.dock.clear'), run: clear }
    : locate
      ? { icon: 'locate', label: t('way.point.locate'), run: locate, color: colors.routeSwap }
      : null;
  if (!tool) return button;
  return (
    <div className="home-dock-tooled">
      {button}
      <button type="button" className="home-dock-tool" aria-label={tool.label} onClick={tool.run}>
        <Icon name={tool.icon} size={TOOL} {...(tool.color ? { color: tool.color } : {})} />
      </button>
    </div>
  );
}

function EndButton({ end, label, ring }: EndProps) {
  return (
    <button type="button" className="home-dock-end" onClick={end.onTap}>
      <span className={`home-dock-ring ${ring}`} />
      <span className="home-dock-words">
        <span className="home-dock-label">{label}</span>
        {end.value ? (
          <span className="home-dock-value">{end.value}</span>
        ) : (
          <span className="home-dock-empty">{end.placeholder}</span>
        )}
        {end.hint ? <span className="home-dock-hint">{end.hint}</span> : null}
      </span>
    </button>
  );
}
