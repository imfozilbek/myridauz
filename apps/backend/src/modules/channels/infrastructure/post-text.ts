import { channelVia, routeFindLink, tripBookLink, type Trip } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { endNames, type Places } from '../../../shared/places/end-names';
import { bold, escapeHtml as escape, quote } from '../../../shared/telegram/html';
import { postState, regionOf } from '../domain/route-channels';
import { lifePost, type Post } from './post-life';
import { hashtagOf, whenLine } from './post-parts';

const { t, formatDate, formatWeekday, formatNumber } = createI18n(DEFAULT_LOCALE);
const FREE = '🟩';
const TAKEN = '⬜';

// How the driver picks people up (docs/70): at the door, at the pitak of the direction, or both.
function pickupLine(trip: Trip): string {
  const pitak = trip.pitak ? escape(trip.pitak.name) : null;
  if (trip.pickupMode === 'door' || !pitak) return t('bot.channel.pickupDoor');
  return t(trip.pickupMode === 'pitak' ? 'bot.channel.pickupPitak' : 'bot.channel.pickupBoth', { pitak });
}

// «🟩🟩⬜⬜ 2 ta boʻsh joy»: the free seats green, the taken ones white.
function seatsLine(trip: Trip): string {
  const free = Math.max(trip.seatsLeft, 0);
  const bar = FREE.repeat(free) + TAKEN.repeat(Math.max(trip.seats - free, 0));
  return t('bot.channel.seats', { bar, seats: String(free), price: bold(formatNumber(trip.price)) });
}

function carLine(trip: Trip): string {
  const { model, color } = trip.driver.car;
  const { average } = trip.driver.rating;
  const car = escape(`${model}, ${t(`drivers.color.${color}`).toLocaleLowerCase()}`);
  // Every driver who posts has passed the check of the team (docs/04).
  const rating =
    average === null
      ? t('bot.channel.newDriver')
      : t('bot.channel.rating', { average: formatNumber(average) });
  return t('bot.channel.car', { car, rating });
}

// «Toshkent shahri → Samarqand viloyati, 2-oktabr, juma: boʻsh joy bor.» under the shared link.
function shareUrl(bookUrl: string, trip: Trip, places: Places): string {
  const departAt = new Date(trip.departAt);
  const text = t('bot.channel.shareText', {
    from: places.get(regionOf(trip.from, places))?.name ?? trip.from,
    to: places.get(regionOf(trip.to, places))?.name ?? trip.to,
    date: `${formatDate(departAt)}, ${formatWeekday(departAt)}`,
  });
  return `https://t.me/share/url?url=${encodeURIComponent(bookUrl)}&text=${encodeURIComponent(text)}`;
}

// A trip with seats, as the bot shows it (G68, docs/122, mockup g68/5 «Safar posti»): 🟢 and 🔴 in
// quotes with the district, the region and how the driver takes and brings people; the seats, the
// car, the check, the rating; hashtags of the places. No address, no plate, no name (docs/15).
function openPost(trip: Trip, places: Places, now: number, book: string): Post {
  const names = endNames(trip.from, trip.to, places);
  const head = trip.seatsLeft === 1 ? 'bot.channel.lastSeat' : 'bot.channel.new';
  const tags = [trip.to, trip.from].map((id) => hashtagOf(places.get(id)?.name ?? '')).filter(Boolean);
  const text = [
    bold(t(head)),
    bold(whenLine(trip, now)),
    quote([`🟢 ${names.from}`, pickupLine(trip)]),
    quote([`🔴 ${names.to}`, t('bot.channel.dropoff')]),
    seatsLine(trip),
    carLine(trip),
    ...(trip.woman ? [t('bot.channel.woman')] : []),
    ...(tags.length > 0 ? [tags.join(' ')] : []),
  ].join('\n');
  const buttons = [
    { text: t('bot.channel.book'), url: book },
    { text: t('bot.channel.share'), url: shareUrl(book, trip, places) },
  ];
  return { text, markup: { inline_keyboard: [buttons] } };
}

// The channel post of a trip (docs/15, G68): url buttons only, web_app buttons do not work in
// channels. Every link carries the mark of its channel (G55, docs/116).
export const channelPost =
  (passengerBot: string) =>
  (trip: Trip, places: Places, now: number, channel: string): Post => {
    const state = postState(trip, now);
    const via = channelVia(channel);
    if (state === 'open' || state === 'lastSeat')
      return openPost(trip, places, now, tripBookLink(passengerBot, trip.id, via));
    return lifePost(state, trip, places, now, routeFindLink(passengerBot, trip.from, trip.to, via));
  };
