import {
  PICKUP_MODES,
  type Location,
  type PickupMode,
  type PlaceName,
  type Point,
} from '@platform/contracts';
import { asRecord } from '../flow/flow-draft';
import { readStored, writeStored } from '../telegram/device-storage';
import type { WayEnd } from './way-end';

// The way of the last booking or request on a route (G35, docs/97 K4): the next one on the same
// route starts with the same points and way, the map opens only to change them. A convenience:
// nothing kept means the maps, as before.
const KEY = 'book_points';
const MAX = 5;
type KeptEnd = { readonly place: string; readonly point: Point; readonly name: PlaceName | null };
type Kept = {
  readonly route: string;
  readonly mode: PickupMode;
  readonly pickup: KeptEnd | null;
  readonly dropoff: KeptEnd;
};
export type RememberedWay = {
  readonly mode: PickupMode;
  readonly pickup: WayEnd | null;
  readonly dropoff: WayEnd;
};

const routeKey = (from: string, to: string) => `${from}:${to}`;
const isEnd = (value: unknown) => {
  const end = asRecord(value);
  const point = asRecord(end?.['point']);
  return (
    typeof end?.['place'] === 'string' &&
    typeof point?.['lat'] === 'number' &&
    typeof point['lng'] === 'number'
  );
};
const isKept = (value: unknown): value is Kept => {
  const kept = asRecord(value);
  return (
    typeof kept?.['route'] === 'string' &&
    PICKUP_MODES.some((mode) => mode === kept['mode']) &&
    (kept['pickup'] === null || isEnd(kept['pickup'])) &&
    isEnd(kept['dropoff'])
  );
};

function keptWays(): Kept[] {
  try {
    const parsed: unknown = JSON.parse(readStored(KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter(isKept) : [];
  } catch {
    return [];
  }
}

const keep = (end: WayEnd): KeptEnd | null =>
  end.point ? { place: end.place.id, point: end.point, name: end.name } : null;

export function rememberWay(from: string, to: string, way: RememberedWay) {
  const dropoff = keep(way.dropoff);
  if (!dropoff) return;
  const route = routeKey(from, to);
  const kept: Kept = { route, mode: way.mode, pickup: way.pickup ? keep(way.pickup) : null, dropoff };
  const others = keptWays().filter((old) => old.route !== route);
  writeStored(KEY, JSON.stringify([kept, ...others].slice(0, MAX)));
}

// The way kept for this route, with its places from the directory; a place gone drops it.
export function rememberedWay(
  from: string,
  to: string,
  find: (id: string) => Location | undefined,
): RememberedWay | null {
  const kept = keptWays().find((old) => old.route === routeKey(from, to));
  if (!kept) return null;
  const end = (saved: KeptEnd): WayEnd | null => {
    const place = find(saved.place);
    return place ? { place, point: saved.point, name: saved.name } : null;
  };
  const dropoff = end(kept.dropoff);
  const pickup = kept.pickup ? end(kept.pickup) : null;
  if (!dropoff || (kept.mode !== 'pitak' && !pickup)) return null;
  return { mode: kept.mode, pickup: kept.mode === 'pitak' ? null : pickup, dropoff };
}
