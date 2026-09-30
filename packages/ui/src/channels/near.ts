import type { Location } from '@platform/contracts';

// Districts closer than this are neighbours: one post can go to their channels too (docs/63).
const NEAR_KM = 40;
const EARTH_KM = 6371;
const rad = (degrees: number) => (degrees * Math.PI) / 180;

// The distance in a straight line between two places.
export function kmBetween(a: Location, b: Location): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.sqrt(h));
}

// The chosen places and every other district or city near one of them, in their order.
export function withNear(chosen: readonly Location[], all: readonly Location[]): string[] {
  const near = all.filter(
    (place) =>
      place.parentId !== null &&
      !chosen.includes(place) &&
      chosen.some((one) => one.parentId !== null && kmBetween(one, place) <= NEAR_KM),
  );
  return [...chosen, ...near].map((place) => place.id);
}
