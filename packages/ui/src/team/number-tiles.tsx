import './number-tiles.css';
import { haptic } from '../telegram/feedback';

// change: how the number moved since the period before, «↑ 6» (G45, F-A12 of docs/90). onClick: the
// tile opens its list, «bugun qildingiz» opens «Mening qarorlarim» (G95).
type Tile = {
  readonly value: string | number;
  readonly label: string;
  readonly change?: string;
  readonly onClick?: () => void;
};

type TilesProps = {
  readonly tiles: readonly Tile[];
  // Four squares of the own work of a moderator, three wider tiles of «Statistika» (mockup g67/1).
  readonly kind: 'work' | 'stats';
};

// Numbers on white tiles: the number big, its name in gray under it (mockup g67/1, G78 sheet 4).
export function NumberTiles({ tiles, kind }: TilesProps) {
  return (
    <div className={`number-tiles number-tiles-${kind}`}>
      {tiles.map(({ value, label, change, onClick }) => {
        const inside = (
          <>
            <b>{value}</b>
            <span>{label}</span>
            {change ? <small>{change}</small> : null}
          </>
        );
        return onClick ? (
          <button
            key={label}
            type="button"
            className="number-tile number-tile-open"
            onClick={() => {
              haptic.tap();
              onClick();
            }}
          >
            {inside}
          </button>
        ) : (
          <div key={label} className="number-tile">
            {inside}
          </div>
        );
      })}
    </div>
  );
}
