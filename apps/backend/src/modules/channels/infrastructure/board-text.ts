import { channelVia, tashkentDate, tripBookLink, withVia, type Trip } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Card } from '../../notifications';
import type { Places } from '../../../shared/places/end-names';
import { bold, escapeHtml, italic } from '../../../shared/telegram/html';
import { covers, postState, regionOf, type ChannelCoverage } from '../domain/route-channels';
import { timeOf } from './post-parts';

const { t, formatDate, formatTime, formatNumber } = createI18n(DEFAULT_LOCALE);
// A Telegram message holds 4096 signs: a busy day ends with «… va yana N ta».
const MAX_TEXT = 3500;
const DONE = { full: 'bot.board.full', started: 'bot.board.started', arrived: 'bot.board.arrived' } as const;

type Site = {
  readonly bot: string;
  readonly domain: string;
  readonly pageOf: (channel: string) => string | undefined;
};
type Group = { readonly title: string; readonly lines: string[] };

const nameOf = (id: string, places: Places) => escapeHtml(places.get(id)?.name ?? id);

// «08:00 Chilonzor → Urgut · 2 joy · 90 000»: the time opens the trip, the place of the channel in
// bold; a trip with no seats, on the road or arrived is struck.
function line(trip: Trip, places: Places, now: number, inbound: boolean, book: string): string {
  const from = nameOf(trip.from, places);
  const to = nameOf(trip.to, places);
  const state = postState(trip, now);
  const time = timeOf(trip.departAt);
  if (state === 'full' || state === 'started' || state === 'arrived')
    return `<s>${t('bot.board.done', { time, route: t('bot.news.route', { from, to }), state: t(DONE[state]) })}</s>`;
  const route = t('bot.news.route', inbound ? { from, to: bold(to) } : { from: bold(from), to });
  const seats =
    state === 'lastSeat' ? t('bot.board.lastSeat') : t('bot.board.seats', { count: String(trip.seatsLeft) });
  return t('bot.board.line', {
    time: `<a href="${book}">${time}</a>`,
    route,
    seats,
    price: formatNumber(trip.price),
  });
}

// «➡️ Toshkent shahridan» for the trips coming to the channel, «⬅️ Toshkent shahriga» for leaving.
function groupsOf(channel: ChannelCoverage, trips: readonly Trip[], places: Places, now: number, site: Site) {
  const groups = new Map<string, Group>();
  const via = channelVia(channel.username);
  for (const trip of trips) {
    const inbound = covers(channel, trip.to, places);
    const other = nameOf(regionOf(inbound ? trip.from : trip.to, places), places);
    const title = bold(t(inbound ? 'bot.board.from' : 'bot.board.to', { region: other }));
    const group = groups.get(title) ?? { title, lines: [] };
    group.lines.push(line(trip, places, now, inbound, tripBookLink(site.bot, trip.id, via)));
    groups.set(title, group);
  }
  return [...groups.values()];
}

function textOf(head: string, groups: readonly Group[]): string {
  const parts = [head];
  let left = groups.reduce((sum, group) => sum + group.lines.length, 0);
  for (const group of groups) {
    parts.push('', group.title);
    for (const next of group.lines) {
      if (parts.join('\n').length + next.length > MAX_TEXT)
        return [...parts, t('bot.news.more', { count: String(left) })].join('\n');
      parts.push(next);
      left -= 1;
    }
  }
  return parts.join('\n');
}

function buttons(channel: ChannelCoverage, first: Trip, places: Places, site: Site, share: string) {
  const via = channelVia(channel.username);
  const route = `${regionOf(first.from, places)}_${regionOf(first.to, places)}`;
  const subscribe = `https://t.me/${site.bot}?startapp=${withVia(`sub_${route}_${tashkentDate(first.departAt)}`, via)}`;
  const shared = `https://t.me/share/url?url=${encodeURIComponent(`https://t.me/${channel.username}`)}&text=${encodeURIComponent(share)}`;
  return {
    inline_keyboard: [
      [{ text: t('bot.board.find'), url: `https://t.me/${site.bot}?startapp=${withVia('', via)}` }],
      [
        { text: t('bot.board.subscribe'), url: subscribe },
        { text: t('bot.channel.share'), url: shared },
      ],
    ],
  };
}

// The board of the day of one channel (G68, docs/122, mockup g68/5 «Kun taxtasi»): every trip of
// today, pinned, its first message the one sound of the day, the picture of the direction above it.
export const boardCard =
  (site: Site) =>
  (channel: ChannelCoverage, trips: readonly Trip[], places: Places, now: number): Card | null => {
    const today = trips
      .filter((trip) => trip.status !== 'cancelled' && !trip.private)
      .sort((a, b) => a.departAt - b.departAt);
    const first = today[0];
    if (!first) return null;
    const values = { date: formatDate(new Date(now)), count: String(today.length) };
    const page = site.pageOf(channel.username);
    return {
      bot: 'passenger',
      chatId: `@${channel.username}`,
      key: `board:${tashkentDate(now)}`,
      text: textOf(bold(t('bot.board.title', values)), groupsOf(channel, today, places, now, site)),
      footer: italic(
        `${t('bot.card.updated', { time: formatTime(new Date(now)) })} · ${t('bot.board.hint')}`,
      ),
      markup: buttons(channel, first, places, site, t('bot.board.shareText', values)),
      pin: true,
      loud: true,
      ...(page ? { preview: `https://${site.domain}${page}` } : {}),
    };
  };
