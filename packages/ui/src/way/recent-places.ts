import { recentPlacesSchema, type RecentPlace } from '@platform/contracts';

// The last places a person chose (docs/71): only on this phone, a convenience, never needed.
// The storage may be closed (a private window): then there are simply no recent places.
const KEY = 'way.recent';
const MAX = 5;

export function recentPlaces(): RecentPlace[] {
  try {
    const parsed = recentPlacesSchema.safeParse(JSON.parse(localStorage.getItem(KEY) ?? '[]'));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

export function rememberPlace(place: RecentPlace) {
  const same = (other: RecentPlace) =>
    other.point.lat === place.point.lat && other.point.lng === place.point.lng;
  const next = [place, ...recentPlaces().filter((other) => !same(other))].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // No storage: nothing to remember.
  }
}
