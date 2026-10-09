import type { BrandConfig } from '@platform/brands';
import {
  FIND_LINK,
  REQUESTS_LINK,
  requestsLinkValue,
  tashkentDate,
  tashkentDayStart,
} from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { News, NewsLine } from '../../notifications';
import { bold, italic } from '../../../shared/telegram/html';
import { appButton } from '../../../shared/telegram/open-button';
import { newsFoot, newsHead, newsRoute, requestLine, tripLine } from '../../../shared/telegram/route-news';
import type { SubscriptionTeller } from '../application/ports';
import type { Match, SubscriptionRecord } from '../domain/subscription';

const { t } = createI18n(DEFAULT_LOCALE);

// «Bu yoʻnalish kerak emas»: the subscription ends right from the card (docs/122 rule 4).
export const NEWS_OFF_PREFIX = 'news_off';
const SUBSCRIPTIONS_PARAM = 'subscriptions';

type Wiring = {
  readonly brand: BrandConfig;
  readonly placeName: (id: string) => Promise<string>;
  readonly show: (news: News) => Promise<void>;
  readonly now: () => number;
};

type Way = Pick<Match, 'from' | 'to' | 'date'>;
const departAt = (match: Match) => Date.parse(`${match.date}T${match.time ?? '00:00'}:00+05:00`);

// A passenger hears of trips in the passenger bot, a driver of requests in the driver bot, in the
// news card of the route of the subscription (docs/02, docs/122 rule 4).
export const botTeller = ({ brand, placeName, show, now }: Wiring): SubscriptionTeller => {
  const isTrips = (subscription: SubscriptionRecord) => subscription.kind === 'trips';
  // The buttons open the search or the requests of the route and day of the latest news, as it was
  // published: its places, not the region of the subscription (docs/83 N08).
  const buttons = (subscription: SubscriptionRecord, latest: Way) => {
    const link = { id: requestsLinkValue(latest.from, latest.to, latest.date) };
    const off = { callback_data: `${NEWS_OFF_PREFIX}:${subscription.id}` };
    if (isTrips(subscription))
      return [
        [appButton(brand, 'passenger', t('bot.news.all'), { ...link, name: FIND_LINK })],
        [{ ...off, text: t('bot.news.off') }],
      ];
    return [
      [
        appButton(brand, 'driver', t('bot.news.offer'), { ...link, name: REQUESTS_LINK }),
        { ...off, text: t('bot.news.offShort') },
      ],
    ];
  };
  const card = async (subscription: SubscriptionRecord, latest: Way, line?: NewsLine): Promise<News> => {
    const kind = subscription.kind;
    return {
      bot: isTrips(subscription) ? 'passenger' : 'driver',
      chatId: subscription.userId,
      route: newsRoute(subscription.from, subscription.to),
      head: newsHead(kind, await placeName(subscription.from), await placeName(subscription.to)),
      foot: newsFoot(kind),
      markup: { inline_keyboard: buttons(subscription, latest) },
      ...(line ? { line } : {}),
    };
  };
  const lineOf = async (subscription: SubscriptionRecord, match: Match, cheaper: boolean) => {
    if (isTrips(subscription)) {
      const trip = { ...match, departAt: departAt(match), time: match.time ?? '' };
      return tripLine(trip, { cheaper }, now());
    }
    const [from, to] = await Promise.all([placeName(match.from), placeName(match.to)]);
    return requestLine({ ...match, day: tashkentDayStart(match.date), from, to }, now());
  };
  return {
    one: async (subscription, match) =>
      show(await card(subscription, match, await lineOf(subscription, match, false))),
    cheaper: async (subscription, match) =>
      show(await card(subscription, match, await lineOf(subscription, match, true))),
    // «Any date» is over: the card of the day asks to renew it, the button opens «Obunalar».
    renew: async (subscription) => {
      const news = await card(subscription, { ...subscription, date: tashkentDate(now()) });
      const renew = appButton(brand, isTrips(subscription) ? 'passenger' : 'driver', t('bot.news.renew'), {
        name: SUBSCRIPTIONS_PARAM,
        id: '1',
      });
      await show({
        ...news,
        head: [bold(t('bot.news.ended')), ...news.head.slice(1)],
        foot: italic(t('bot.news.endedHint')),
        markup: { inline_keyboard: [[renew]] },
      });
    },
  };
};
