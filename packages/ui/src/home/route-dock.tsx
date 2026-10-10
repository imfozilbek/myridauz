import type { ReactNode } from 'react';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import './route-dock.css';

const SWAP = 16;

type DockEnd = {
  // The place shown, or null: the gray question takes its line.
  readonly value: string | null;
  readonly placeholder: string;
  // Under the place: how it was found, or how many trips go there.
  readonly hint?: ReactNode;
  readonly onTap: () => void;
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
        <button type="button" className="home-dock-swap" aria-label={t('home.dock.swap')} onClick={onSwap}>
          <Icon name="swap" size={SWAP} color={colors.routeSwap} />
        </button>
      </div>
      <End end={to} label={t('places.to')} ring="home-dock-to" />
    </div>
  );
}

type EndProps = { readonly end: DockEnd; readonly label: string; readonly ring: string };

function End({ end, label, ring }: EndProps) {
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
