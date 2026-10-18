import './number-tiles.css';

// change: how the number moved since the period before, «↑ 6» (G45, F-A12 of docs/90).
type Tile = { readonly value: string | number; readonly label: string; readonly change?: string };

type TilesProps = {
  readonly tiles: readonly Tile[];
  // Four squares of the own work of a moderator, three wider tiles of «Statistika» (mockup g67/1).
  readonly kind: 'work' | 'stats';
};

// Numbers on white tiles: the number big, its name in gray under it (mockup g67/1, G78 sheet 4).
export function NumberTiles({ tiles, kind }: TilesProps) {
  return (
    <div className={`number-tiles number-tiles-${kind}`}>
      {tiles.map(({ value, label, change }) => (
        <div key={label} className="number-tile">
          <b>{value}</b>
          <span>{label}</span>
          {change ? <small>{change}</small> : null}
        </div>
      ))}
    </div>
  );
}
