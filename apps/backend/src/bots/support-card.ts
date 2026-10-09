import { appHost, type BrandConfig } from '@platform/brands';
import { DAY_MS, formatPlate, LINK_ID, OPEN_LINK, TEAM_TRIPS_SECTION, TRIP_LINK } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { endNames } from '../shared/places/end-names';
import { bold, escapeHtml, italic, mono, quote } from '../shared/telegram/html';
import { shortDay } from '../shared/telegram/route-news';
import type { Asker } from './support-asker';
import { mediaLabel } from './support-talk';
import type { Media } from '../shared/telegram/telegram-files';

const { t, formatTime, formatNumber } = createI18n(DEFAULT_LOCALE);
const MONTH_DAYS = 30;
export const REPLY_DATA = 'support:reply';
export const HISTORY_DATA = 'support:history';

// The card of a question for the team (G68, docs/122, mockup g68/4): who writes and in which role,
// the booking or the trip they live with now, the text, how long with the brand. Never the Telegram
// ID (lesson №136).

// «3 kun» in the first month, then «3 oy».
function since(joinedAt: number, now: number): string {
  const days = Math.floor((now - joinedAt) / DAY_MS) + 1;
  if (days < MONTH_DAYS) return t('bot.supportCard.days', { count: String(days) });
  return t('bot.supportCard.months', { count: String(Math.floor(days / MONTH_DAYS)) });
}

// «📌 Faol bron: Chilonzor → Urgut, ertaga 08:30» and the driver with the plate under it.
function liveBlock(asker: Asker, now: number): string[] {
  const { booking } = asker;
  const live = booking?.trip ?? asker.trip;
  if (!live) return [];
  const names = endNames(live.from, live.to, asker.places);
  const when = `${shortDay(live.departAt, now)} ${formatTime(new Date(live.departAt))}`;
  const head = t(booking ? 'bot.supportCard.booking' : 'bot.supportCard.trip', { ...names, when });
  if (!booking) return [quote([head])];
  const { firstName, car } = booking.trip.driver;
  const name = escapeHtml(firstName);
  const driver = car.plate
    ? t('bot.supportCard.driver', { name, plate: mono(formatPlate(car.plate)) })
    : name;
  return [quote([head, driver])];
}

// «Rida bilan 3 oy · 7 safar · ⭐ 4,9»: only for a person with an account.
function factsLine(brand: BrandConfig, asker: Asker, now: number): string[] {
  if (asker.joinedAt === undefined) return [];
  const rating = asker.rating?.average;
  const parts = [
    t('bot.supportCard.with', { brand: brand.name, since: since(asker.joinedAt, now) }),
    t('bot.supportCard.rides', { count: String(asker.rides ?? 0) }),
    ...(rating === null || rating === undefined ? [] : [`⭐ ${formatNumber(rating)}`]),
  ];
  return [italic(parts.join(' · '))];
}

export function supportCard(
  brand: BrandConfig,
  asker: Asker,
  said: { readonly kind: Media['kind'] | 'text'; readonly text: string | undefined },
  now: number,
): string {
  const who = t('bot.supportCard.who', {
    name: escapeHtml(asker.name),
    role: t(`bot.supportCard.role.${asker.role}`),
  });
  const label = mediaLabel(said.kind);
  return [
    `💬 ${bold(t('bot.supportCard.title'))}`,
    bold(who),
    ...liveBlock(asker, now),
    ...(label ? [label] : []),
    ...(said.text ? [t('bot.supportCard.text', { text: escapeHtml(said.text) })] : []),
    ...factsLine(brand, asker, now),
  ].join('\n');
}

// «Javob berish», «Tarix» for a person who wrote before, and «Bronni ochish» in the admin app.
export function supportButtons(brand: BrandConfig, asker: Asker, wroteBefore: boolean) {
  const reply = { text: t('bot.supportCard.reply'), callback_data: REPLY_DATA };
  const history = { text: t('bot.supportCard.history'), callback_data: HISTORY_DATA };
  const first = wroteBefore ? [reply, history] : [reply];
  const live = asker.booking?.trip ?? asker.trip;
  if (!live || !LINK_ID.test(live.id)) return { inline_keyboard: [first] };
  const url = `https://${appHost(brand, 'admin')}/?${OPEN_LINK}=${TEAM_TRIPS_SECTION}&${TRIP_LINK}=${live.id}`;
  const open = {
    text: t(asker.booking ? 'bot.supportCard.openBooking' : 'bot.supportCard.openTrip'),
    web_app: { url },
  };
  return { inline_keyboard: [first, [open]] };
}
