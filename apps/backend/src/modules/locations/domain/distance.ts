// Road distance = straight line between the centers × road factor of the pair of regions (docs/48).
// Roads bend around mountains and deserts, so each pair of regions has its own factor.
export type Point = { readonly lat: number; readonly lng: number };

export type RoadFactors = {
  // Used for a pair of regions without its own factor.
  readonly default: number;
  // Key: two region ids in ascending order, "1703-1726". The same id twice: inside one region.
  readonly pairs: Readonly<Record<string, number>>;
};

const EARTH_RADIUS_KM = 6371;
const MIN_KM = 1;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export function straightKm(a: Point, b: Point): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

const regionPairKey = (a: string, b: string) => (a < b ? `${a}-${b}` : `${b}-${a}`);

export function roadFactor(factors: RoadFactors, regionA: string, regionB: string): number {
  return factors.pairs[regionPairKey(regionA, regionB)] ?? factors.default;
}

export function roadKm(a: Point, b: Point, factor: number): number {
  return Math.max(MIN_KM, Math.round(straightKm(a, b) * factor));
}
