import type { Point } from '@platform/contracts';

// The borders of districts and cities (G24, docs/48): the district of a point is the border that
// holds it, not the nearest center. Kept as polylines (precision 1e-4, about 11 m): small to ship.
export type Ring = readonly (readonly [lng: number, lat: number])[];
// A place may have several parts; each part is its outer ring and its holes.
export type Border = {
  readonly id: string;
  readonly parts: readonly (readonly Ring[])[];
  readonly box: {
    readonly south: number;
    readonly west: number;
    readonly north: number;
    readonly east: number;
  };
};

const PRECISION = 1e4;
const CHUNK = 0x1f;
const MORE = 0x20;
const OFFSET = 63;

// Google's polyline format: lat and lng as differences, five bits per character.
export function decodeRing(line: string): Ring {
  const ring: [number, number][] = [];
  let index = 0;
  const next = () => {
    let result = 0;
    let shift = 0;
    let byte = MORE;
    while (byte >= MORE) {
      byte = line.charCodeAt(index) - OFFSET;
      index += 1;
      result |= (byte & CHUNK) << shift;
      shift += 5;
    }
    return result & 1 ? ~(result >> 1) : result >> 1;
  };
  let lat = 0;
  let lng = 0;
  while (index < line.length) {
    lat += next();
    lng += next();
    ring.push([lng / PRECISION, lat / PRECISION]);
  }
  return ring;
}

export function borderOf(id: string, lines: readonly (readonly string[])[]): Border {
  const parts = lines.map((part) => part.map(decodeRing));
  const vertices = parts.flat(2);
  const lngs = vertices.map(([lng]) => lng);
  const lats = vertices.map(([, lat]) => lat);
  const box = {
    south: Math.min(...lats),
    west: Math.min(...lngs),
    north: Math.max(...lats),
    east: Math.max(...lngs),
  };
  return { id, parts, box };
}

// A ray to the east crosses the edges of the rings: an odd count is inside (holes count too).
function crossings(ring: Ring, { lat, lng }: Point) {
  let count = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [lngA, latA] = ring[i] ?? [0, 0];
    const [lngB, latB] = ring[j] ?? [0, 0];
    if (latA > lat !== latB > lat && lng < ((lngB - lngA) * (lat - latA)) / (latB - latA) + lngA) count += 1;
  }
  return count;
}

export function holds(border: Border, point: Point): boolean {
  const { south, west, north, east } = border.box;
  if (point.lat < south || point.lat > north || point.lng < west || point.lng > east) return false;
  return border.parts.some((part) => part.reduce((sum, ring) => sum + crossings(ring, point), 0) % 2 === 1);
}

// The district or city of a point; null outside every border (abroad or on a gap of 11 m).
export const districtAt = (borders: readonly Border[], point: Point): string | null =>
  borders.find((border) => holds(border, point))?.id ?? null;
