import type { Location } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { useI18n } from '../context/i18n-context';
import type { PlaceDirectory } from './directory';

// The names of the route rule (docs/121): a region by its short name on a card («Samarqand»), a place
// with its region («Chilonzor, Toshkent shahri»). Never only «Toshkent», never «tumani».
export function usePlaceNames(directory: PlaceDirectory) {
  const { t } = useI18n();
  const short = (region: Location) => t(`places.short.${region.id}` as TranslationKey);
  const full = (place: Location) => {
    const region = place.parentId === null ? undefined : directory.find(place.parentId);
    return region ? `${place.name}, ${region.name}` : place.name;
  };
  return { short, full };
}
