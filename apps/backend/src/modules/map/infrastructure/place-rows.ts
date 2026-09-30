import type { PlaceKind, Point } from '@platform/contracts';
import { placeCell } from '../domain/place-cell.ts';
import { placeKind } from '../domain/place-kind.ts';
import { searchKey } from '../domain/search-key.ts';

// The places of the search index (G23, docs/67), built by pnpm map-data from the same archive
// as the map. Pure: the script reads the tiles, this decides what goes into D1.
// The imports carry «.ts»: node runs this file straight from the script.

// A named thing as a tile gives it: the name of the map, the Uzbek one and the other spellings.
export type RawPlace = {
  readonly layer: string;
  readonly kind: string;
  readonly name: string;
  readonly uz?: string;
  readonly names: readonly string[];
  readonly point: Point;
};
export type Area = { readonly name: string; readonly lat: number; readonly lng: number };
export type PlaceRow = {
  readonly name: string;
  readonly kind: PlaceKind;
  readonly area: string | null;
  readonly point: Point;
  readonly words: string;
  readonly cell: string;
};

// One landmark: the same name within this many degrees (about 300 m), from two layers or tiles.
const SAME_SPOT_DEGREES = 0.003;
const COORDINATE_DIGITS = 5;

const round = (value: number) => Number(value.toFixed(COORDINATE_DIGITS));

function nearestArea(areas: readonly Area[], { lat, lng }: Point): string | null {
  const scale = Math.cos((lat * Math.PI) / 180);
  let best: Area | null = null;
  let bestDistance = Infinity;
  for (const area of areas) {
    const distance = ((area.lng - lng) * scale) ** 2 + (area.lat - lat) ** 2;
    if (distance < bestDistance) [best, bestDistance] = [area, distance];
  }
  return best?.name ?? null;
}

const wordsOf = (spellings: readonly string[]) =>
  [...new Set(spellings.flatMap((spelling) => searchKey(spelling).split(' ')).filter(Boolean))].join(' ');

const sameSpot = (a: Point, b: Point) =>
  Math.abs(a.lat - b.lat) < SAME_SPOT_DEGREES && Math.abs(a.lng - b.lng) < SAME_SPOT_DEGREES;

// A street is one per district: its pieces lie in many tiles. A landmark is one per spot.
function seenBefore(
  seen: Map<string, Point[]>,
  kind: PlaceKind,
  key: string,
  area: string | null,
  point: Point,
) {
  const id = kind === 'street' ? `${kind}|${key}|${area ?? ''}` : `${kind}|${key}`;
  const points = seen.get(id) ?? [];
  if (kind === 'street' ? points.length > 0 : points.some((other) => sameSpot(other, point))) return true;
  seen.set(id, [...points, point]);
  return false;
}

export function collectPlaces(
  raws: Iterable<RawPlace>,
  areas: readonly Area[],
  inside: (point: Point) => boolean,
): PlaceRow[] {
  const places: PlaceRow[] = [];
  const seen = new Map<string, Point[]>();
  for (const raw of raws) {
    const kind = placeKind(raw.layer, raw.kind);
    const name = (raw.uz ?? raw.name).trim();
    const key = searchKey(name);
    if (kind === null || key === '' || !inside(raw.point)) continue;
    const area = nearestArea(areas, raw.point);
    if (seenBefore(seen, kind, key, area, raw.point)) continue;
    const point = { lat: round(raw.point.lat), lng: round(raw.point.lng) };
    const words = wordsOf([name, raw.name, ...raw.names]);
    places.push({ name, kind, area, point, words, cell: placeCell(point) });
  }
  return places;
}
