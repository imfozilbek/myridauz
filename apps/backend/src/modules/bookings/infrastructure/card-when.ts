import { arrivalAt, DAY_MS, tashkentDate, type Trip } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { bold, italic } from '../../../shared/telegram/html';

const { t, formatDate, formatTime } = createI18n(DEFAULT_LOCALE);

// «Ertaga, 7-oktabr»: today and tomorrow by name, a later day by its date.
function dayOf(at: number, now: number): string {
  const date = formatDate(new Date(at));
  const day = tashkentDate(at);
  if (day === tashkentDate(now)) return t('bot.card.day', { day: t('market.day.today'), date });
  if (day === tashkentDate(now + DAY_MS)) return t('bot.card.day', { day: t('market.day.tomorrow'), date });
  return date;
}

// When the trip goes, in bold, on both trip cards (mockups g68/2, g68/3); on the road: when it arrives.
export function whenLines(trip: Trip, onWay: boolean, now: number): string[] {
  const time = formatTime(new Date(trip.departAt));
  if (onWay) {
    const arrival = formatTime(new Date(arrivalAt(trip.departAt, trip.km)));
    return [bold(t('bot.card.arrival', { day: t('market.day.today'), time, arrival }))];
  }
  const when = bold(t('bot.card.when', { day: dayOf(trip.departAt, now), time }));
  // The driver moved the time: the old one stays under it (mockup g68/2 «08:00 edi»).
  if (trip.departAt === trip.firstDepartAt) return [when];
  return [when, italic(t('bot.card.wasTime', { time: formatTime(new Date(trip.firstDepartAt)) }))];
}
