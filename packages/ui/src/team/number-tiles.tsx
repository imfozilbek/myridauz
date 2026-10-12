import './number-tiles.css';

type Tile = { readonly value: string | number; readonly label: string };

type TilesProps = {
  readonly tiles: readonly Tile[];
  // Four squares of the own work of a moderator, three wider tiles of «Statistika» (mockup g67/1).
  readonly kind: 'work' | 'stats';
};

// Numbers on white tiles: the number big, its name in gray under it (mockup g67/1, G78 sheet 4).
export function NumberTiles({ tiles, kind }: TilesProps) {
  return (
    <div className={`number-tiles number-tiles-${kind}`}>
      {tiles.map(({ value, label }) => (
        <div key={label} className="number-tile">
          <b>{value}</b>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
