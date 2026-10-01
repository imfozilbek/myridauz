import {
  SEARCH_MIN_LETTERS,
  SEARCH_RESULTS,
  searchKey,
  type FoundPlace,
  type Point,
} from '@platform/contracts';
import { nearCells } from '../domain/place-cell';
import type { PlaceIndex } from './ports';

// The search of places by name on the map (G23, docs/67). Near the start of the trip first: a
// person waits for the driver where they are. Far places only when near ones are too few. With a
// zone (G26, docs/74) only its districts, nearest first: the point of a booking lies there.
const sameSpot = (a: FoundPlace, b: FoundPlace) =>
  a.name === b.name && a.point.lat === b.point.lat && a.point.lng === b.point.lng;

export async function searchPlaces(
  index: PlaceIndex,
  query: string,
  near: Point | null,
  districts: readonly string[] | null,
): Promise<FoundPlace[]> {
  const key = searchKey(query);
  if (key.replaceAll(' ', '').length < SEARCH_MIN_LETTERS) return [];
  const words = key.split(' ');
  if (districts) return index.find({ words, cells: null, near, districts }, SEARCH_RESULTS);
  const nearby = near
    ? await index.find({ words, cells: nearCells(near), near, districts }, SEARCH_RESULTS)
    : [];
  if (nearby.length >= SEARCH_RESULTS) return nearby;
  const far = await index.find({ words, cells: null, near, districts }, SEARCH_RESULTS);
  const others = far.filter((place) => !nearby.some((other) => sameSpot(place, other)));
  return [...nearby, ...others].slice(0, SEARCH_RESULTS);
}
