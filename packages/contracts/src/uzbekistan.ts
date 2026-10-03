import border from './uzbekistan-border.json' with { type: 'json' };
import type { Point } from './point';
import { insideParts } from './polygon';

// The border of Uzbekistan from OpenStreetMap (relation 196240), simplified to about 1 km:
// polygons of rings of [lng, lat]. A pickup point is taken inside it (docs/14, G22).
type Ring = readonly (readonly number[])[];
const POLYGONS = border as readonly (readonly Ring[])[];

// The simplified border may cut a town at the very edge: a point this close to it still counts.
const BORDER_MARGIN_KM = 3;
const KM_PER_DEGREE = 111.32;

const coordinates = (vertex: readonly number[]) => [vertex[0] ?? 0, vertex[1] ?? 0] as const;

// The same border for a map: outside it is shaded and out of reach (G24).
export const UZBEKISTAN_PARTS = POLYGONS.map((polygon) => polygon.map((ring) => ring.map(coordinates)));

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
  return insideParts(POLYGONS, point) || nearBorder(point);
}
