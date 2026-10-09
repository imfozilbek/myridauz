import { tashkentDate, type Booking, type Location } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { useShortDay } from '../market/when';
import type { PlaceDirectory } from '../places/directory';
import { usePlaceNames } from '../places/place-names';
import { useNameText } from '../way/way-end';

type Way = { readonly from: string; readonly to: string; readonly departAt: number };

// The words of a sheet about a trip (mockups g68/7, g68/8): «Ertaga 08:00 · Chilonzor → Samarqand»,
// where it starts and where it goes, a city by its region alone.
export function useSheetWords(directory: PlaceDirectory) {
  const { t, formatTime } = useI18n();
  const shortDay = useShortDay();
  const names = usePlaceNames(directory);
  const nameText = useNameText();
  const place = (id: string) => {
    const found: Location | undefined = directory.find(id);
    return found ? names.toward(found) : '';
  };
  const day = (at: number) => shortDay(tashkentDate(at), Date.now());
  const when = (at: number) => t('home.trip.when', { day: day(at), time: formatTime(new Date(at)) });
  return {
    place,
    day,
    when,
    line: (way: Way) =>
      t('sheet.trip', { when: when(way.departAt), from: place(way.from), to: place(way.to) }),
    // Where the driver picks the passenger up: the pitak, the point, or the area before the answer.
    pickup: ({ pitak, pickup }: Booking) => {
      if (pitak) return pitak.name;
      if (!pickup) return '';
      if (pickup.point) return nameText(pickup.name, '');
      const area = pickup.area;
      if (!area) return '';
      return area.step === 'landmark' ? nameText(area, '') : t('way.driver.areaOnly', { area: area.name });
    },
  };
}
