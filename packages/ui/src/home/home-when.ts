import { tashkentDate } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { useCardDay } from '../market/when';

// «Bugun 08:00», «Ertaga 09:30», «12-okt 08:00»: the day and the time of a seat or a trip, short
// enough for a tile (G76, mockup g76/2).
export function useWhen(now: number) {
  const { t, formatTime } = useI18n();
  const cardDay = useCardDay();
  return (at: number) =>
    t('home.trip.when', { day: cardDay(tashkentDate(at), now), time: formatTime(new Date(at)) });
}
