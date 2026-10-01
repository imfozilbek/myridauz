import data from '../../../../seed/district-borders.json' with { type: 'json' };
import { borderOf, type Border } from '../domain/borders.ts';

// The borders built by scripts/district-borders.py (G24): read once, when first asked.
// The import carries «.ts»: the index script runs this file straight from node.
let borders: Border[] | null = null;

export function districtBorders(): readonly Border[] {
  borders ??= Object.entries(data.places).map(([id, lines]) => borderOf(id, lines));
  return borders;
}
