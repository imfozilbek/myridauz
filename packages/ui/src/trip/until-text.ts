import { tashkentDate } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { today, tomorrow } from '../market/when';

// «bugun 20:55 gacha», «ertaga 20:55 gacha» or «9-oktabr 20:55 gacha»: a deadline after the trip
// (docs/129) on the booking page and in the chat field.
export function useUntilText() {
  const { t, formatDate, formatTime } = useI18n();
  return (ms: number, now: number) => {
    const time = formatTime(new Date(ms));
    const day = tashkentDate(ms);
    if (day === today(now)) return t('bookings.done.untilToday', { time });
    if (day === tomorrow(now)) return t('bookings.done.untilTomorrow', { time });
    return t('bookings.done.until', { date: formatDate(new Date(ms)), time });
  };
}
