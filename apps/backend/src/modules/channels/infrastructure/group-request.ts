import { channelVia, requestsBoardLink, requestsLinkValue, tashkentDayStart } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Places } from '../../../shared/places/end-names';
import { bold } from '../../../shared/telegram/html';
import type { GroupRequest } from '../application/request-posts';
import { groupMark, inScript, placeOf, type GroupLook } from './group-look';
import { EMPTY_SEATS } from './group-trip';
import type { Post } from './post-life';
import { dayLabel } from './post-parts';

const { t, formatNumber } = createI18n(DEFAULT_LOCALE);

// A passenger's request of the Mini App in a direction group, as the group's own cards (owner,
// 05.11.2026, mockup of docs/223): «🙋 MASHINA KERAK · Yunusoboddan» with the turquoise R, where to,
// the day, the people and the price. A request has a day, no hour. The button opens the requests of
// the route and day in the driver bot (docs/83 N08). No name, no phone (docs/07).
export const groupRequestPost =
  (driverBot: string, look: GroupLook) =>
  (request: GroupRequest, places: Places, now: number, chat: string): Post => {
    const from = placeOf(request.from, places);
    const empty = request.wholeCar || request.seats >= EMPTY_SEATS;
    const head = t(empty ? 'bot.group.needEmpty' : 'bot.group.need', from);
    const text = [
      `${bold(head)} ${groupMark(look.cards, 'request')}`,
      t('bot.group.going', placeOf(request.to, places)),
      t('bot.group.day', { day: dayLabel(tashkentDayStart(request.date), now) }),
      t('bot.group.people', { people: String(request.seats), price: formatNumber(request.price) }),
    ].join('\n');
    const value = requestsLinkValue(request.from, request.to, request.date);
    const take = requestsBoardLink(driverBot, value, channelVia(chat));
    return inScript(look.cards, {
      text,
      markup: { inline_keyboard: [[{ text: t('bot.group.take'), url: take }]] },
    });
  };

// The post of a request that closed: deleted, or these words where Telegram keeps it (docs/223).
export const closedRequestPost = (look: GroupLook) => (): Post =>
  inScript(look.cards, { text: bold(t('bot.group.closed')), markup: { inline_keyboard: [] }, remove: true });
