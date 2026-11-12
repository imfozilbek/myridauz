import type { FoundPlace, PlaceName, Where } from '@platform/contracts';
import { toCyrillic } from '@platform/i18n';

// The names of the map and of the team stay in Latin, as they were written (G48); people read them in
// Cyrillic, made by the program of the texts (G98, docs/228). A cache of these answers keys them by
// this alphabet, so an answer in the old letters is never served again.
export const NAMES_ALPHABET = 'uz-Cyrl';

const shownName = (name: PlaceName | null): PlaceName | null =>
  name && { ...name, name: toCyrillic(name.name) };

export const shownPlace = (place: FoundPlace): FoundPlace => ({
  ...place,
  name: toCyrillic(place.name),
  area: place.area && toCyrillic(place.area),
});

export const shownWhere = (where: Where): Where => ({
  ...where,
  name: shownName(where.name),
  area: shownName(where.area),
});
