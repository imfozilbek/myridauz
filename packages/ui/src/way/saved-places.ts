import { savedPlacesSchema, type RecentPlace, type SavedPlaces } from '@platform/contracts';
import { readStored, writeStored } from '../telegram/device-storage';

// «Uyim» and «Ishxonam» (docs/126): kept once on all phones of the person, then one tap. A
// convenience: nothing kept means the map, as before.
const KEY = 'way_saved';
export type SavedKind = 'home' | 'work';

export function savedPlaces(): SavedPlaces {
  try {
    const parsed = savedPlacesSchema.safeParse(JSON.parse(readStored(KEY) ?? '{}'));
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}

export function savePlace(kind: SavedKind, place: RecentPlace) {
  writeStored(KEY, JSON.stringify({ ...savedPlaces(), [kind]: place }));
}
