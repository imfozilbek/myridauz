import { recentPlacesSchema, type RecentPlace } from '@platform/contracts';
import { readStored, writeStored } from '../telegram/device-storage';

// The last places a person chose (docs/71): on all their phones (docs/88 L12), a convenience, never needed.
const KEY = 'way_recent';
const MAX = 5;

export function recentPlaces(): RecentPlace[] {
  try {
    const parsed = recentPlacesSchema.safeParse(JSON.parse(readStored(KEY) ?? '[]'));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

// One name in one district is one place, wherever the pin stood on it (G36, docs/100 DS2); a point
// with no name is the same place only at the same point.
const samePlace = (one: RecentPlace, other: RecentPlace) =>
  one.district === other.district &&
  (one.name && other.name
    ? one.name.name === other.name.name
    : one.point.lat === other.point.lat && one.point.lng === other.point.lng);

export function rememberPlace(place: RecentPlace) {
  const next = [place, ...recentPlaces().filter((other) => !samePlace(other, place))].slice(0, MAX);
  writeStored(KEY, JSON.stringify(next));
}
