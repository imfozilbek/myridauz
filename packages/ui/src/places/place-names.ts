import type { Location } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { useI18n } from '../context/i18n-context';
import type { PlaceDirectory } from './directory';

// The names of the route rule (docs/121): a region by its short name on a card («Samarqand»), a place
// with its region («Chilonzor, Toshkent shahri»), never «tumani». «Qayerdan» of the search names the
// region short, as on the approved journey (G59): «Chilonzor, Toshkentdan».
// While the list of places still loads (the main screen, G66), a place goes by its own name.
export function usePlaceNames(directory: PlaceDirectory | null) {
  const { t } = useI18n();
  const short = (region: Location) => t(`places.short.${region.id}` as TranslationKey);
  const parentOf = (place: Location) =>
    place.parentId === null ? undefined : directory?.find(place.parentId);
  const full = (place: Location) => {
    const region = parentOf(place);
    return region ? `${place.name}, ${region.name}` : place.name;
  };
  const from = (place: Location) => {
    const region = parentOf(place);
    return region ? `${place.name}, ${short(region)}` : short(place);
  };
  // An end of a new trip (G63, journey g63/4 screen 3): the place with its region in full, a city
  // named after its region alone («Samarqand shahri», not «…, Samarqand viloyati»).
  const end = (place: Location) => {
    const region = parentOf(place);
    return region && place.name.startsWith(short(region)) ? place.name : full(place);
  };
  // Where a trip goes, short in a sentence (journeys g63/4 screen 14 and g59 screen 16): «Samarqandga»;
  // a city by its region alone, a district by its own name, a whole region by its short name.
  const toward = (place: Location) => {
    const region = parentOf(place);
    if (!region) return short(place);
    return place.name.startsWith(short(region)) ? short(region) : place.name;
  };
  return { short, full, from, end, toward };
}
