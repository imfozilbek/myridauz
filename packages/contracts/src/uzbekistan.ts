import border from './uzbekistan-border.json' with { type: 'json' };
import type { Point } from './bookings';

// The border of Uzbekistan from OpenStreetMap (relation 196240), simplified to about 1 km:
// polygons of rings of [lng, lat]. A pickup point is taken inside it (docs/14, G22).
type Ring = readonly (readonly number[])[];
const POLYGONS = border as readonly (readonly Ring[])[];

// The simplified border may cut a town at the very edge: a point this close to it still counts.
const BORDER_MARGIN_KM = 3;
const KM_PER_DEGREE = 111.32;

const coordinates = (vertex: readonly number[]) => [vertex[0] ?? 0, vertex[1] ?? 0] as const;

// Even-odd rule: a ray to the east crosses the ring an odd number of times from inside.
function crossesOdd(ring: Ring, { lat, lng }: Point): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = coordinates(ring[i] ?? []);
    const [xj, yj] = coordinates(ring[j] ?? []);
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// The distance from a point to a border segment in km, on a flat map around the point.
function kmToSegment(point: Point, from: readonly number[], to: readonly number[]): number {
  const scale = Math.cos((point.lat * Math.PI) / 180);
  const [ax, ay] = coordinates(from);
  const [bx, by] = coordinates(to);
  const [px, py] = [(ax - point.lng) * scale, ay - point.lat];
  const [dx, dy] = [(bx - ax) * scale, by - ay];
  const length = dx * dx + dy * dy;
  const t = length === 0 ? 0 : Math.max(0, Math.min(1, -(px * dx + py * dy) / length));
  return Math.hypot(px + t * dx, py + t * dy) * KM_PER_DEGREE;
}

const nearBorder = (point: Point) =>
  POLYGONS.some((polygon) =>
    polygon.some((ring) =>
      ring.some((vertex, index) => {
        const next = ring[index + 1];
        return next !== undefined && kmToSegment(point, vertex, next) <= BORDER_MARGIN_KM;
      }),
    ),
  );

// The point is in Uzbekistan: inside the border, not in a hole of it, or right at the border.
export function insideUzbekistan(point: Point): boolean {
  const inside = POLYGONS.some(
    (polygon) => polygon.filter((ring) => crossesOdd(ring, point)).length % 2 === 1,
  );
  return inside || nearBorder(point);
}
