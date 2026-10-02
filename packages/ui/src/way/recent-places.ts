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

export function rememberPlace(place: RecentPlace) {
  const same = (other: RecentPlace) =>
    other.point.lat === place.point.lat && other.point.lng === place.point.lng;
  const next = [place, ...recentPlaces().filter((other) => !same(other))].slice(0, MAX);
  writeStored(KEY, JSON.stringify(next));
}
