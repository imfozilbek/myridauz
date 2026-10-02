import { appHost, type BrandConfig } from '@platform/brands';
import { REQUESTS_LINK, requestsLinkValue } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { NotificationJob } from '../../notifications';
import type { SubscriptionTeller } from '../application/ports';
import type { SubscriptionRecord } from '../domain/subscription';

const { t, formatMoney, formatDate } = createI18n(DEFAULT_LOCALE);

// The Mini App opens a trip, the requests of a route and day, or the list of subscriptions, at once (docs/24).
const TRIP_PARAM = 'trip';
const SUBSCRIPTIONS_PARAM = 'subscriptions';

type Wiring = {
  readonly brand: BrandConfig;
  readonly placeName: (id: string) => Promise<string>;
  readonly send: (jobs: readonly NotificationJob[]) => Promise<void>;
  // «Bot xabarlari» off in the profile: the news of the subscriptions stay quiet (docs/88 L1).
  readonly wantsNews: (userId: number) => Promise<boolean>;
};

// A passenger hears from the passenger bot, a driver from the driver bot (docs/02).
export const botTeller = ({ brand, placeName, send, wantsNews }: Wiring): SubscriptionTeller => {
  const role = (subscription: SubscriptionRecord) => (subscription.kind === 'trips' ? 'passenger' : 'driver');
  const button = (subscription: SubscriptionRecord, text: string, query = '') => ({
    inline_keyboard: [[{ text, web_app: { url: `https://${appHost(brand, role(subscription))}/${query}` } }]],
  });
  const route = async (subscription: SubscriptionRecord) => ({
    from: await placeName(subscription.from),
    to: await placeName(subscription.to),
  });
  const tell = async (subscription: SubscriptionRecord, text: string, markup: object) => {
    if (await wantsNews(subscription.userId))
      await send([{ bot: role(subscription), chatId: subscription.userId, text, markup }]);
  };
  return {
    one: async (subscription, match) => {
      const values = {
        from: await placeName(match.from),
        to: await placeName(match.to),
        date: formatDate(new Date(`${match.date}T12:00:00+05:00`)),
        time: match.time ?? '',
        seats: String(match.seats),
        price: formatMoney(match.price),
      };
      const isTrip = subscription.kind === 'trips';
      const text = t(isTrip ? 'bot.subscription.trip' : 'bot.subscription.request', values);
      const query = isTrip
        ? `?${TRIP_PARAM}=${match.id}`
        : `?${REQUESTS_LINK}=${requestsLinkValue(match.from, match.to, match.date)}`;
      await tell(subscription, text, button(subscription, t('bot.subscription.open'), query));
    },
    many: async (subscription, count) => {
      const key =
        subscription.kind === 'trips' ? 'bot.subscription.manyTrips' : 'bot.subscription.manyRequests';
      const text = t(key, { ...(await route(subscription)), count: String(count) });
      await tell(subscription, text, button(subscription, t('bot.subscription.open')));
    },
    renew: async (subscription) => {
      const text = t('bot.subscription.renew', await route(subscription));
      const query = `?${SUBSCRIPTIONS_PARAM}=1`;
      await tell(subscription, text, button(subscription, t('bot.subscription.list'), query));
    },
  };
};
