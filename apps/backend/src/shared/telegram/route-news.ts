import { DAY_MS, tashkentDate } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { NewsLine } from '../../modules/notifications';
import { bold, escapeHtml, italic } from './html';

const { t, formatMoney, formatShortDate } = createI18n(DEFAULT_LOCALE);

// The lines of the news cards of a route (G68, docs/122 rule 4, mockups g68/1 and g68/3): the
// passenger bot lists new trips, the driver bot new requests.
export const newsRoute = (from: string, to: string) => `${from}>${to}`;

// «bugun», «ertaga», later «9-okt»: a short day for a line.
export function shortDay(at: number, now: number): string {
  const day = tashkentDate(at);
  if (day === tashkentDate(now)) return t('requests.day.today');
  if (day === tashkentDate(now + DAY_MS)) return t('requests.day.tomorrow');
  return formatShortDate(new Date(at));
}

// The status and the route on top of a card: «🔔 Bugungi yangi safarlar», «Chilonzor → Urgut».
export const newsHead = (kind: 'trips' | 'requests', from: string, to: string) => [
  bold(t(kind === 'trips' ? 'bot.news.trips' : 'bot.news.requests')),
  bold(t('bot.news.route', { from, to })),
];

// «Kuniga bitta xabar · yangi safar chiqsa, shu xabar yangilanadi».
export const newsFoot = (kind: 'trips' | 'requests') =>
  italic(t(kind === 'trips' ? 'bot.news.tripsHint' : 'bot.news.requestsHint'));

export type TripNews = {
  readonly id: string;
  readonly name: string;
  readonly departAt: number;
  readonly time: string;
  readonly seats: number;
  readonly price: number;
};

// «♥ Jasur · ertaga 07:30 · 2 joy · 90 000 soʻm», a cheaper one ends «↓ arzonlashdi».
export function tripLine(trip: TripNews, marks: { favorite?: boolean; cheaper?: boolean }, now: number) {
  const plain = t('bot.news.trip', {
    name: escapeHtml(trip.name),
    day: shortDay(trip.departAt, now),
    time: trip.time,
    seats: String(trip.seats),
    price: bold(formatMoney(trip.price)),
  });
  const cheaper = marks.cheaper ? t('bot.news.cheaper', { line: plain }) : plain;
  const text = marks.favorite ? t('bot.news.favorite', { line: cheaper }) : cheaper;
  return { id: trip.id, text, order: trip.departAt } satisfies NewsLine;
}

export type RequestNews = {
  readonly id: string;
  readonly name: string;
  readonly day: number;
  readonly seats: number;
  readonly price: number;
  readonly wholeCar: boolean;
  readonly from: string;
  readonly to: string;
};

// «Sardor · 2 kishi · ertaga · Chilonzor → Samarqand shahri · 90 000 soʻm»; the whole car with its
// whole price: «🚐 Aziz · butun salon · 9-okt · … · 360 000 soʻm».
export function requestLine(request: RequestNews, now: number): NewsLine {
  const values = {
    name: escapeHtml(request.name),
    seats: String(request.seats),
    day: shortDay(request.day, now),
    from: request.from,
    to: request.to,
  };
  const text = request.wholeCar
    ? t('bot.news.wholeCar', { ...values, price: bold(formatMoney(request.price * request.seats)) })
    : t('bot.news.request', { ...values, price: bold(formatMoney(request.price)) });
  return { id: request.id, text, order: request.day };
}
