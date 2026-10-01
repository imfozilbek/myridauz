import type { Location } from './locations';

// Rida is only for trips between places (docs/14). The Mini App shows the error right when
// "to" is chosen, the server checks the same rule when a trip or a request is saved.
export const ROUTE_ERRORS = ['locations.same_place', 'locations.inside_city'] as const;
export type RouteError = (typeof ROUTE_ERRORS)[number];

type Place = Pick<Location, 'id' | 'parentId' | 'oneCity'>;
type FindPlace = (id: string) => Place | undefined;

// The one-city region a place belongs to (the region itself or its district), if any.
function cityOf(place: Place, find: FindPlace): string | null {
  if (place.oneCity) return place.id;
  const parent = place.parentId === null ? undefined : find(place.parentId);
  return parent?.oneCity ? parent.id : null;
}

// The zone of a point of a booking (G26, docs/74): the whole city for a place of Toshkent shahri,
// else the place itself (a district, or a region chosen whole).
export const zoneOf = (place: Place, find: FindPlace): string => cityOf(place, find) ?? place.id;

export function checkRoute(from: Place, to: Place, find: FindPlace): RouteError | null {
  if (from.id === to.id) return 'locations.same_place';
  const city = cityOf(from, find);
  return city !== null && city === cityOf(to, find) ? 'locations.inside_city' : null;
}
