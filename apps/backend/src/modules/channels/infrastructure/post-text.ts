import { arrivalAt, tashkentDate, type Trip } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE, type TranslationKey } from '@platform/i18n';
import { postState, regionOf } from '../domain/route-channels';

const { t, formatMoney, formatDate, formatWeekday, formatTime } = createI18n(DEFAULT_LOCALE);

type Place = { readonly name: string; readonly parentId: string | null };
type Places = ReadonlyMap<string, Place>;
type Post = { readonly text: string; readonly markup: object };

// The post is HTML (bold lines); names come from the directory and the driver, so they are escaped.
const escape = (text: string) => text.replace(/&/gu, '&amp;').replace(/</gu, '&lt;').replace(/>/gu, '&gt;');
const bold = (text: string) => `<b>${text}</b>`;
const nameOf = (id: string, places: Places) => escape(places.get(id)?.name ?? id);

// "Toshkent shahri → Samarqand viloyati" in bold, then the places: the reader sees the way at once.
function route(trip: Trip, places: Places): string[] {
  const [from, to] = [regionOf(trip.from, places), regionOf(trip.to, places)];
  return [
    bold(`${nameOf(from, places)} → ${nameOf(to, places)}`),
    t('bot.channel.places', { from: nameOf(trip.from, places), to: nameOf(trip.to, places) }),
  ];
}

const dayOf = (departAt: Date) => `${formatDate(departAt)}, ${formatWeekday(departAt)}`;

function details(trip: Trip): string[] {
  const departAt = new Date(trip.departAt);
  const { make, model, color } = trip.driver.car;
  const paint = t(`drivers.color.${color}`).toLocaleLowerCase();
  return [
    t('bot.channel.date', { date: bold(dayOf(departAt)) }),
    t('bot.channel.time', {
      depart: bold(formatTime(departAt)),
      arrive: formatTime(new Date(arrivalAt(trip.departAt, trip.km))),
    }),
    t(trip.seatsLeft === 1 ? 'bot.channel.lastSeat' : 'bot.channel.seats', {
      seats: bold(String(trip.seatsLeft)),
    }),
    t('bot.channel.price', { price: bold(formatMoney(trip.price)) }),
    t('bot.channel.car', { car: escape(`${make} ${model}, ${paint}`) }),
    // Every driver who posts has passed the check of the team (docs/04).
    t('bot.channel.verified'),
    trip.driver.rating.average === null
      ? t('bot.channel.newDriver')
      : t('bot.channel.rating', { average: trip.driver.rating.average, count: trip.driver.rating.count }),
    ...(trip.woman ? [t('bot.channel.woman')] : []),
    ...(trip.hasMeetingPoint ? [t('bot.channel.meeting')] : []),
  ];
}

// #Samarqand: a tap shows every trip of the region in the channel.
export const tagOf = (region: string) => `#${t(`bot.channel.tag.${region}` as TranslationKey)}`;

function tags(trip: Trip, places: Places): string {
  return [...new Set([regionOf(trip.from, places), regionOf(trip.to, places)])].map(tagOf).join(' ');
}

// "Shu yoʻnalishga obuna": the route of the regions and the day, into the passenger Mini App (docs/24).
function subscribeUrl(bot: string, trip: Trip, places: Places): string {
  const route = `${regionOf(trip.from, places)}_${regionOf(trip.to, places)}`;
  return `https://t.me/${bot}?startapp=sub_${route}_${tashkentDate(trip.departAt)}`;
}

// "Doʻstga yuborish": Telegram's own share window with the link of the trip.
function shareUrl(bookUrl: string, trip: Trip, places: Places): string {
  const text = t('bot.channel.shareText', {
    from: places.get(regionOf(trip.from, places))?.name ?? trip.from,
    to: places.get(regionOf(trip.to, places))?.name ?? trip.to,
    date: dayOf(new Date(trip.departAt)),
  });
  return `https://t.me/share/url?url=${encodeURIComponent(bookUrl)}&text=${encodeURIComponent(text)}`;
}

const HEADER = {
  full: 'bot.channel.full',
  started: 'bot.channel.started',
  cancelled: 'bot.channel.cancelled',
} as const;

// The channel post of a trip (docs/15): no contacts, no name, no plate; url buttons only,
// web_app buttons do not work in channels. A full, departed or cancelled trip keeps the route and
// the day and still offers the subscription: the post brings people to the route even then (docs/18).
export const channelPost =
  (passengerBot: string) =>
  (trip: Trip, places: Places, now: number): Post => {
    const state = postState(trip, now);
    const subscribe = { text: t('bot.channel.subscribe'), url: subscribeUrl(passengerBot, trip, places) };
    if (state !== 'open') {
      const departAt = new Date(trip.departAt);
      const when = t('bot.channel.date', { date: `${dayOf(departAt)}, ${formatTime(departAt)}` });
      const text = [bold(t(HEADER[state])), ...route(trip, places), when].join('\n');
      return { text, markup: { inline_keyboard: [[subscribe]] } };
    }
    const text = [...route(trip, places), '', ...details(trip), '', tags(trip, places)].join('\n');
    const bookUrl = `https://t.me/${passengerBot}?startapp=trip_${trip.id}`;
    const book = { text: t('bot.channel.book'), url: bookUrl };
    const share = { text: t('bot.channel.share'), url: shareUrl(bookUrl, trip, places) };
    return { text, markup: { inline_keyboard: [[book], [share], [subscribe]] } };
  };
