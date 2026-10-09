import { arrivalAt, DAY_MS, tashkentDate, type Trip } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Places } from '../../../shared/places/end-names';
import { escapeHtml } from '../../../shared/telegram/html';

const { t, formatDate, formatTime } = createI18n(DEFAULT_LOCALE);

// The pieces of the channel posts (G68, docs/122, mockup g68/5).

// «Bugun», «Ertaga, 8-oktabr», later «10-oktabr».
export function dayLabel(at: number, now: number): string {
  const day = tashkentDate(at);
  if (day === tashkentDate(now)) return t('market.day.today');
  const date = formatDate(new Date(at));
  if (day === tashkentDate(now + DAY_MS)) return t('bot.card.day', { day: t('market.day.tomorrow'), date });
  return date;
}

export const timeOf = (at: number) => formatTime(new Date(at));
// «Ertaga, 8-oktabr · 08:00 → ≈ 13:10»: when it leaves and about when it comes.
export const whenLine = (trip: Trip, now: number) =>
  t('bot.channel.when', {
    day: dayLabel(trip.departAt, now),
    depart: timeOf(trip.departAt),
    arrive: timeOf(arrivalAt(trip.departAt, trip.km)),
  });

const nameOf = (id: string, places: Places) => escapeHtml(places.get(id)?.name ?? id);
// «Chilonzor → Urgut»: the places only, for the short posts and the board of the day.
export const shortRoute = (trip: Trip, places: Places) =>
  t('bot.news.route', { from: nameOf(trip.from, places), to: nameOf(trip.to, places) });

// The people of the car with the driver: the way is shared by all of them; 0 when nobody booked.
export function peopleOf(trip: Trip): number {
  const taken = trip.seats - Math.max(trip.seatsLeft, 0);
  return taken > 0 ? taken + 1 : 0;
}

// #Kattaqorgon: a tap shows every trip of the place in the channel. Only Latin letters and digits
// make a hashtag in Telegram.
export function hashtagOf(name: string): string {
  const words = name
    .split(/[\s-]+/u)
    .map((word) => word.replace(/[^A-Za-z0-9]/gu, ''))
    .filter(Boolean);
  if (words.length === 0) return '';
  return `#${words.map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`).join('')}`;
}
