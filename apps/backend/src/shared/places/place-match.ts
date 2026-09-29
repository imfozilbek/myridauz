import type { Location } from '@platform/contracts';

type Places = ReadonlyMap<string, Pick<Location, 'id' | 'parentId' | 'oneCity'>>;

// Does a trip or a request place fit a search (docs/14)? A search by a region finds all its places.
// A place of a one-city region (Toshkent shahri) stands for the whole city: a driver picks up anywhere in it.
export function placeMatches(placeId: string, searchId: string, places: Places): boolean {
  if (placeId === searchId) return true;
  const place = places.get(placeId);
  const search = places.get(searchId);
  if (!place || !search) return false;
  if (search.parentId === null) return place.parentId === search.id;
  const region = places.get(search.parentId);
  return region?.oneCity === true && place.parentId === region.id;
}
