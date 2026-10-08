import type { Location } from '@platform/contracts';

type Places = ReadonlyMap<string, Pick<Location, 'id' | 'parentId' | 'oneCity'>>;

// A place and its region (docs/14): a region is its own region.
export const regionIn = (places: ReadonlyMap<string, Pick<Location, 'parentId'>>) => (id: string) =>
  places.get(id)?.parentId ?? id;

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

// Every place that fits a search, the same rule as placeMatches: the database reads only the trips
// from these places, through an index, not every trip of the day (G56, docs/117).
export function placesMatching(searchId: string, places: Places): string[] {
  const fits = [...places.keys()].filter((id) => id !== searchId && placeMatches(id, searchId, places));
  return [searchId, ...fits];
}
