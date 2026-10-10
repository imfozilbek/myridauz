import { tashkentDate } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { useShortDay } from '../market/when';

// «Bugun 08:00», «Ertaga 09:30», «12-okt 08:00»: the day and the time of a seat or a trip, as on
// the cards of the main screen (G66, G76).
export function useWhen(now: number) {
  const { t, formatTime } = useI18n();
  const shortDay = useShortDay();
  return (at: number) =>
    t('home.trip.when', { day: shortDay(tashkentDate(at), now), time: formatTime(new Date(at)) });
}
