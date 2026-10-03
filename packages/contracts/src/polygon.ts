import type { Point } from './point';

// Polygons of rings of [lng, lat], as a border of a place or of the country is kept (G24).
type Ring = readonly (readonly number[])[];
type Parts = readonly (readonly Ring[])[];

const lngLat = (vertex: readonly number[]) => [vertex[0] ?? 0, vertex[1] ?? 0] as const;

// Even-odd rule: a ray to the east crosses the ring an odd number of times from inside.
function crossesOdd(ring: Ring, { lat, lng }: Point): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = lngLat(ring[i] ?? []);
    const [xj, yj] = lngLat(ring[j] ?? []);
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// The point is inside the parts: in a polygon and not in a hole of it.
export const insideParts = (parts: Parts, point: Point): boolean =>
  parts.some((polygon) => polygon.filter((ring) => crossesOdd(ring, point)).length % 2 === 1);

// The points where a line of latitude crosses a ring, west to east.
function crossings(ring: Ring, lat: number): number[] {
  const found: number[] = [];
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = lngLat(ring[i] ?? []);
    const [xj, yj] = lngLat(ring[j] ?? []);
    if (yi > lat !== yj > lat) found.push(((xj - xi) * (lat - yi)) / (yj - yi) + xi);
  }
  return found.sort((a, b) => a - b);
}

// A point surely inside a place (G35): the center of its box when it is inside, else the middle of
// the widest piece of its middle latitude. The center of a district may lie outside its border.
export function pointInside(parts: Parts): Point | null {
  const outer = parts.map((polygon) => polygon[0] ?? []).sort((a, b) => b.length - a.length)[0] ?? [];
  if (outer.length < 3) return null;
  const lats = outer.map((vertex) => lngLat(vertex)[1]);
  const lngs = outer.map((vertex) => lngLat(vertex)[0]);
  const lat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const center = { lat, lng: (Math.min(...lngs) + Math.max(...lngs)) / 2 };
  if (insideParts(parts, center)) return center;
  const xs = crossings(outer, lat);
  let best: Point | null = null;
  let width = 0;
  for (let i = 0; i + 1 < xs.length; i += 2) {
    const [west, east] = [xs[i] ?? 0, xs[i + 1] ?? 0];
    if (east - west > width) [width, best] = [east - west, { lat, lng: (west + east) / 2 }];
  }
  return best;
}
