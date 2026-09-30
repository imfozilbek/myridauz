import type { Point } from '@platform/contracts';

// Where a point of a trip may lie (docs/69): in the district of the trip, anywhere in a region that
// is one city (Toshkent), or near the district's center: big districts have their center far from
// the edge. The number is checked on the data of the beta test.
const NEAR_CENTER_KM = 15;
const KM_PER_DEGREE = 111.32;

export type DirectoryPlace = {
  readonly id: string;
  readonly parentId: string | null;
  readonly lat: number;
  readonly lng: number;
};

const kmBetween = (a: Point, b: Point) =>
  Math.hypot(a.lat - b.lat, (a.lng - b.lng) * Math.cos((a.lat * Math.PI) / 180)) * KM_PER_DEGREE;

export function fitsPlace(
  point: Point,
  district: string | null,
  place: DirectoryPlace | undefined,
  oneCity: (regionId: string) => boolean,
  parentOf: (id: string) => string | null,
): boolean {
  if (!place || district === null) return false;
  if (district === place.id) return true;
  const region = place.parentId;
  if (region !== null && oneCity(region) && parentOf(district) === region) return true;
  return kmBetween(point, place) <= NEAR_CENTER_KM;
}
