import type { GroupCards } from '@platform/brands';
import {
  channelVia,
  DAY_MS,
  requestsBoardLink,
  requestsLinkValue,
  tashkentDate,
  tashkentDayStart,
} from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Places } from '../../../shared/places/end-names';
import { bold, customEmoji } from '../../../shared/telegram/html';
import type { GroupRequest } from '../application/request-posts';
import { groupMark, inScript, placeOf, type GroupLook } from './group-look';
import { EMPTY_SEATS } from './group-trip';
import type { Post } from './post-life';

const { t, formatNumber, formatDate } = createI18n(DEFAULT_LOCALE);

// The plain emoji of each tile, where the brand has no tiles or a phone cannot draw them.
const SHOWN = { hand: '🙋', finish: '🏁', clock: '🕓', people: '🧍', money: '💵' } as const;
type Tile = keyof typeof SHOWN;
const tile = (cards: GroupCards, name: Tile) =>
  cards.tiles ? customEmoji(cards.tiles[name], SHOWN[name]) : SHOWN[name];

// «Bugun», «Ertaga», later «10-noyabr»: the day of a request, as the group's own request cards say it.
function dayWord(at: number, now: number): string {
  const day = tashkentDate(at);
  if (day === tashkentDate(now)) return t('market.day.today');
  if (day === tashkentDate(now + DAY_MS)) return t('market.day.tomorrow');
  return formatDate(new Date(at));
}

// The button opens the requests of the route and day in the driver bot (docs/83 N08): the hand
// tile is its icon, as the group's own buttons wear theirs, in place of the emoji of its words.
function takeButton(cards: GroupCards, url: string) {
  const text = t('bot.group.take');
  if (!cards.tiles) return { text, url };
  return { text: text.split(' ').slice(1).join(' '), url, icon_custom_emoji_id: cards.tiles.hand };
}

// A passenger's request of the Mini App in a direction group, as the group's own request cards
// (owner, 06.11.2026: «максимально похож», docs/223): the turquoise tiles, the bold lines, the
// turquoise R of the Mini App, the price. A request has a day, no hour. No name, no phone (docs/07).
export const groupRequestPost =
  (driverBot: string, look: GroupLook) =>
  (request: GroupRequest, places: Places, now: number, chat: string): Post => {
    const { cards } = look;
    const empty = request.wholeCar || request.seats >= EMPTY_SEATS;
    const head = bold(t(empty ? 'bot.group.needEmpty' : 'bot.group.need'));
    const from = t('bot.group.needFrom', placeOf(request.from, places));
    const day = dayWord(tashkentDayStart(request.date), now);
    const people = bold(t('bot.group.people', { people: String(request.seats) }));
    const text = [
      `${tile(cards, 'hand')} ${head} · ${from} ${groupMark(cards, 'request')}`,
      `${tile(cards, 'finish')} ${bold(t('bot.group.going', placeOf(request.to, places)))}`,
      `${tile(cards, 'clock')} ${bold(t('bot.group.day', { day }))}`,
      `${tile(cards, 'people')} ${people} · ${tile(cards, 'money')} ${formatNumber(request.price)}`,
    ].join('\n');
    const take = requestsBoardLink(
      driverBot,
      requestsLinkValue(request.from, request.to, request.date),
      channelVia(chat),
    );
    return inScript(cards, { text, markup: { inline_keyboard: [[takeButton(cards, take)]] } });
  };

// The post of a request that closed: deleted, or these words where Telegram keeps it (docs/223).
export const closedRequestPost = (look: GroupLook) => (): Post =>
  inScript(look.cards, { text: bold(t('bot.group.closed')), markup: { inline_keyboard: [] }, remove: true });
