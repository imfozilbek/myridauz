import { useI18n } from '../context/i18n-context';
import { usePlaces } from '../market/places-gate';
import { usePlaceNames } from '../places/place-names';

// «Chilonzor → Samarqand»: the ends short, as on the tiles of the main screen.
export function useWay() {
  const { t } = useI18n();
  const places = usePlaces();
  const names = usePlaceNames(places);
  return (from: string, to: string) => {
    const [start, end] = [places.find(from), places.find(to)];
    return t('common.route', { from: start ? names.toward(start) : '', to: end ? names.toward(end) : '' });
  };
}
