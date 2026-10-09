import { tashkentDate } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Card } from './cards';

const { t } = createI18n(DEFAULT_LOCALE);

type BotName = Card['bot'];

// One trip or request on the news card: a new one, or one that changed (cheaper, a heart).
export type NewsLine = {
  readonly id: string;
  readonly text: string;
  // Where it stands in the list: the time of the trip or the day of the request.
  readonly order: number;
};

// The news of one route (docs/122 rule 4): one card a day; a new trip or request edits it without
// sound. Its status and route on top, the lines, the hint under them (mockups g68/1, g68/3).
export type News = {
  readonly bot: BotName;
  readonly chatId: number;
  // The route the card follows: the day is added to its key.
  readonly route: string;
  readonly head: readonly string[];
  readonly foot: string;
  readonly line?: NewsLine;
  readonly markup: object;
  // A card that never rings by itself: its news ring under it when they must (owner «Diqqat»).
  readonly quiet?: boolean;
};

export type NewsStore = {
  readonly put: (bot: BotName, chatId: number, card: string, line: NewsLine, now: number) => Promise<void>;
  // The lines of the card in their order.
  readonly lines: (bot: BotName, chatId: number, card: string) => Promise<string[]>;
};

// More lines make a long message: the rest is a number, the Mini App shows them all.
const SHOWN_LINES = 8;

const newsCardKey = (route: string, now: number) => `news:${route}:${tashkentDate(now)}`;

// The card of the day for the route with the new line in it. Its first message rings, unless it is
// night (rule 3); every next news of the day only edits it.
export async function newsCard(store: NewsStore, news: News, now: number, quiet: boolean): Promise<Card> {
  const key = newsCardKey(news.route, now);
  if (news.line) await store.put(news.bot, news.chatId, key, news.line, now);
  const lines = await store.lines(news.bot, news.chatId, key);
  const more = lines.length - SHOWN_LINES;
  return {
    bot: news.bot,
    chatId: news.chatId,
    key,
    text: [
      ...news.head,
      ...lines.slice(0, SHOWN_LINES),
      ...(more > 0 ? [t('bot.news.more', { count: String(more) })] : []),
      news.foot,
    ].join('\n'),
    markup: news.markup,
    loud: !quiet,
  };
}
