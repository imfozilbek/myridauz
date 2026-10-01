import type { Point } from './point';

// The extra way a passenger adds to a driver (G24, docs/70): straight lines on the map times a
// road factor, without outside services. The pickups are one path, the drop-offs another; a new
// point goes into the best place of its path. The factor is checked on the data of the beta test.
export const ROAD_FACTOR = 1.3;
// More extra way than this in the city: the trip still shows, lower and with a mark (docs/70).
export const FAR_EXTRA_KM = 10;
const EARTH_KM = 6371;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export function kmBetween(a: Point, b: Point): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.sqrt(h));
}

// The cheapest place for a point in an open path: before the first, between two, after the last.
export function insertionKm(path: readonly Point[], point: Point): number {
  const [first] = path;
  const last = path.at(-1);
  if (!first || !last) return 0;
  let best = Math.min(kmBetween(point, first), kmBetween(last, point));
  for (let index = 1; index < path.length; index += 1) {
    const [before, after] = [path[index - 1] ?? first, path[index] ?? last];
    best = Math.min(best, kmBetween(before, point) + kmBetween(point, after) - kmBetween(before, after));
  }
  return best;
}

export type Stops = { readonly pickups: readonly Point[]; readonly dropoffs: readonly Point[] };

// The extra km of a new passenger on the road (rounded): a pitak pickup adds nothing, the pitak is
// on the way anyway; a trip without points yet adds nothing either.
export function extraKm(trip: Stops, passenger: { pickup: Point | null; dropoff: Point | null }): number {
  const pickup = passenger.pickup ? insertionKm(trip.pickups, passenger.pickup) : 0;
  const dropoff = passenger.dropoff ? insertionKm(trip.dropoffs, passenger.dropoff) : 0;
  return Math.round((pickup + dropoff) * ROAD_FACTOR);
}

// The order of the stops for the driver: each time the nearest one not yet visited (docs/70).
export function nearestOrder<T extends { readonly point: Point }>(start: Point, stops: readonly T[]): T[] {
  const left = [...stops];
  const ordered: T[] = [];
  let here = start;
  while (left.length > 0) {
    let nearest = 0;
    left.forEach((stop, index) => {
      if (kmBetween(here, stop.point) < kmBetween(here, left[nearest]?.point ?? stop.point)) nearest = index;
    });
    const [next] = left.splice(nearest, 1);
    if (!next) break;
    ordered.push(next);
    here = next.point;
  }
  return ordered;
}
