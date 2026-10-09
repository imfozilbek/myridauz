import { channelVia, tashkentDate, withVia, type Trip } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Card } from '../../notifications';
import { bold, escapeHtml, quote } from '../../../shared/telegram/html';
import { postState, type ChannelCoverage } from '../domain/route-channels';
import { peopleOf } from './post-parts';

const { t, formatDate, formatNumber } = createI18n(DEFAULT_LOCALE);
const RATING_STEP = 10;

type Site = {
  readonly bot: string;
  readonly domain: string;
  readonly pageOf: (channel: string) => string | undefined;
};
type Channel = ChannelCoverage & { readonly title?: string };

const live = (trips: readonly Trip[]) => trips.filter((trip) => trip.status !== 'cancelled' && !trip.private);
const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);
// The trips that came, by «Yetib keldik» or by their time: the social proof of a channel (docs/122).
const arrived = (trips: readonly Trip[], now: number) =>
  trips.filter((trip) => postState(trip, now) === 'arrived');

// «🌙 Kun yakuni»: the trips of the day, the people who arrived, the seats booked and the trips of
// tomorrow; at 22:00, without sound, once (G68, docs/122, mockup g68/5).
export const dayCard =
  (site: Site) =>
  (channel: Channel, today: readonly Trip[], tomorrow: readonly Trip[], now: number): Card | null => {
    const trips = live(today);
    if (trips.length === 0) return null;
    const values = {
      trips: bold(String(trips.length)),
      people: bold(String(sum(arrived(trips, now).map(peopleOf)))),
      seats: bold(String(sum(trips.map((trip) => trip.seats - Math.max(trip.seatsLeft, 0))))),
    };
    const next = live(tomorrow).length;
    const text = [
      bold(t('bot.daySum.title', { date: formatDate(new Date(now)) })),
      quote([t('bot.daySum.trips', values), t('bot.daySum.seats', values)]),
      ...(next > 0 ? [t('bot.daySum.tomorrow', { count: bold(String(next)) })] : []),
    ].join('\n');
    const find = `https://t.me/${site.bot}?startapp=${withVia('', channelVia(channel.username))}`;
    return {
      bot: 'passenger',
      chatId: `@${channel.username}`,
      key: `day:${tashkentDate(now)}`,
      text,
      markup: { inline_keyboard: [[{ text: t('bot.daySum.find'), url: find }]] },
      once: true,
    };
  };

// The rating of the drivers of the week: the mean of the drivers with a rating, to one decimal.
function driversRating(trips: readonly Trip[]): number | null {
  const ratings = new Map(trips.map((trip) => [trip.driver.id, trip.driver.rating.average]));
  const known = [...ratings.values()].filter((value) => value !== null);
  return known.length === 0 ? null : Math.round((sum(known) / known.length) * RATING_STEP) / RATING_STEP;
}

// «📊 Hafta»: the trips that came in 7 days, their people, the rating of the drivers; on Monday,
// with sound and the picture of the direction (G68, docs/122, mockup g68/5).
export const weekCard =
  (site: Site) =>
  (channel: Channel, week: readonly Trip[], now: number): Card | null => {
    const came = arrived(live(week), now);
    if (came.length === 0) return null;
    const name = escapeHtml(channel.title ?? channel.username);
    const rating = driversRating(came);
    const values = { trips: bold(String(came.length)), people: bold(String(sum(came.map(peopleOf)))) };
    const lines = [
      t('bot.weekSum.trips', values),
      ...(rating === null ? [] : [t('bot.weekSum.rating', { average: bold(formatNumber(rating)) })]),
    ];
    const text = [
      bold(t('bot.weekSum.title', { channel: name })),
      quote(lines),
      t('bot.weekSum.thanks'),
    ].join('\n');
    const words = t('bot.weekSum.shareText', {
      channel: channel.title ?? channel.username,
      trips: String(came.length),
    });
    const share = `https://t.me/share/url?url=${encodeURIComponent(`https://t.me/${channel.username}`)}&text=${encodeURIComponent(words)}`;
    const page = site.pageOf(channel.username);
    return {
      bot: 'passenger',
      chatId: `@${channel.username}`,
      key: `week:${tashkentDate(now)}`,
      text,
      markup: { inline_keyboard: [[{ text: t('bot.weekSum.share'), url: share }]] },
      once: true,
      loud: true,
      ...(page ? { preview: `https://${site.domain}${page}` } : {}),
    };
  };
