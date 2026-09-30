import type { FoundPlace, PlaceKind, PlaceName, Point, Where } from '@platform/contracts';
import { districtAt, type Border } from '../domain/borders';
import { nearCells, nearFineCells } from '../domain/place-cell';
import type { PlaceIndex } from './ports';

// The name of a point (G24, docs/69): a ladder from the smallest thing a driver knows to the district.
// Two reads of the index at most: what lies within a kilometre, then the settlement within 3 km.
const LANDMARKS: readonly PlaceKind[] = ['market', 'transport', 'mosque', 'school', 'place', 'health'];
const STEPS: readonly { step: PlaceName['step']; kinds: readonly PlaceKind[]; metres: number }[] = [
  { step: 'landmark', kinds: LANDMARKS, metres: 150 },
  { step: 'mahalla', kinds: ['mahalla'], metres: 500 },
  { step: 'street', kinds: ['street'], metres: 150 },
];
const SETTLEMENT_METRES = 3000;
// Enough for a busy quarter of Tashkent: the nearest things of every kind are among them.
const AROUND_LIMIT = 60;
const METRES_PER_DEGREE = 111_320;

export const metresBetween = (a: Point, b: Point) => {
  const scale = Math.cos((a.lat * Math.PI) / 180);
  return Math.hypot(a.lat - b.lat, (a.lng - b.lng) * scale) * METRES_PER_DEGREE;
};

// Of the landmarks near enough, the kind a person names first wins: a bazaar before a pharmacy.
function pick(places: readonly FoundPlace[], point: Point, kinds: readonly PlaceKind[], metres: number) {
  const close = places.filter((place) => metresBetween(point, place.point) <= metres);
  for (const kind of kinds) {
    const found = close.find((place) => place.kind === kind);
    if (found) return found;
  }
  return undefined;
}

export type NameDeps = {
  readonly index: PlaceIndex;
  readonly borders: readonly Border[];
  readonly districtName: (id: string) => string | undefined;
};

export async function whereIs({ index, borders, districtName }: NameDeps, point: Point): Promise<Where> {
  const district = districtAt(borders, point);
  if (district === null) return { district, name: null };
  const kinds = STEPS.flatMap((step) => step.kinds);
  const cells = { column: 'fine', list: nearFineCells(point) } as const;
  const around = await index.around({ cells, kinds, near: point }, AROUND_LIMIT);
  for (const { step, kinds: stepKinds, metres } of STEPS) {
    const found = pick(around, point, stepKinds, metres);
    if (found) return { district, name: { step, name: found.name } };
  }
  const quarter = { column: 'cell', list: nearCells(point) } as const;
  const [settlement] = await index.around({ cells: quarter, kinds: ['settlement'], near: point }, 1);
  if (settlement && metresBetween(point, settlement.point) <= SETTLEMENT_METRES)
    return { district, name: { step: 'settlement', name: settlement.name } };
  const name = districtName(district);
  return { district, name: name ? { step: 'district', name } : null };
}
