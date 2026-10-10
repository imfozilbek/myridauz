import type { Location } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import type { PlaceDirectory } from './directory';

// «Toshkent shahri → Samarqand viloyati»: a direction by its regions, the title form of docs/121
// (the cards of the main screen and the chats of «Suhbatlar», G66, G76).
export function useRegionRoute(directory: PlaceDirectory) {
  const { t } = useI18n();
  const region = (id: string) => {
    const place = directory.find(id);
    const top: Location | undefined = place?.parentId ? directory.find(place.parentId) : place;
    return top?.name ?? '';
  };
  return (from: string, to: string) => t('common.route', { from: region(from), to: region(to) });
}
