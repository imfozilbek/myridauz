import { DAY_MS, tashkentDate, tashkentDayStart } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';

// Noon of a Tashkent day: a safe moment to format the date of that day in any time zone.
const HALF_DAY_MS = DAY_MS / 2;
export const noonOf = (date: string) => new Date(tashkentDayStart(date) + HALF_DAY_MS);

export const today = (now: number) => tashkentDate(now);
export const tomorrow = (now: number) => tashkentDate(now + DAY_MS);

// "Bugun, 1-oktabr", "Ertaga, 2-oktabr", "3-oktabr, shanba": people plan by days (docs/19).
export function useDayLabel() {
  const { t, formatDate, formatWeekday } = useI18n();
  return (date: string, now: number) => {
    const day = noonOf(date);
    if (date === today(now)) return t('market.date.today', { date: formatDate(day) });
    if (date === tomorrow(now)) return t('market.date.tomorrow', { date: formatDate(day) });
    return t('market.date.other', { date: formatDate(day), weekday: formatWeekday(day) });
  };
}

// "1-oktabr, soat 07:30".
export function useWhenLabel() {
  const { t, formatDate, formatTime } = useI18n();
  return (ms: number) =>
    t('market.trip.when', { date: formatDate(new Date(ms)), time: formatTime(new Date(ms)) });
}

// "Bugun, soat 07:30", "Ertaga, soat 07:30", else "3-oktabr, soat 07:30": the nearest trips by days.
export function useNearWhenLabel() {
  const { t, formatDate, formatTime } = useI18n();
  return (ms: number, now: number) => {
    const time = formatTime(new Date(ms));
    const day = tashkentDate(ms);
    if (day === today(now)) return t('market.trip.whenToday', { time });
    if (day === tomorrow(now)) return t('market.trip.whenTomorrow', { time });
    return t('market.trip.when', { date: formatDate(new Date(ms)), time });
  };
}
