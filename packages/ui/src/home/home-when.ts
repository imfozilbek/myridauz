import { tashkentDate } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { useCardDay } from '../market/when';
import { useTripTime } from '../trip/trip-time';

// «Bugun 08:00», «Ertaga 09:30», «12-okt 08:00»: the day and the time of a seat or a trip, short
// enough for a tile (G76, mockup g76/2); a range «Ertaga 08:00 … 10:00» (G90). until: the end of a
// range, null for one time.
export function useWhen(now: number) {
  const { t } = useI18n();
  const cardDay = useCardDay();
  const tripTime = useTripTime();
  return (at: number, until: number | null) =>
    t('home.trip.when', {
      day: cardDay(tashkentDate(at), now),
      time: tripTime({ departAt: at, departUntil: until }),
    });
}
