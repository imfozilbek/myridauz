import { NEAR_SHOWN, type FoundPlace, type PlaceKind, type Point } from '@platform/contracts';
import { nearFineCells } from '../domain/place-cell';
import type { PlaceIndex } from './ports';

// «Yaqin joylar» (docs/126): the known places within about a kilometre a person names to meet,
// a metro, a bazaar, a shop, nearest first, each name once. One read of the index (docs/117).
const KNOWN: readonly PlaceKind[] = ['transport', 'market', 'place', 'mosque', 'school', 'health'];
const AROUND_LIMIT = 30;

export async function nearPlaces(index: PlaceIndex, point: Point): Promise<FoundPlace[]> {
  const cells = { column: 'fine', list: nearFineCells(point) } as const;
  const around = await index.around({ cells, kinds: KNOWN, near: point }, AROUND_LIMIT);
  const names = new Set<string>();
  return around.filter((place) => !names.has(place.name) && names.add(place.name)).slice(0, NEAR_SHOWN);
}
