import type { BrandConfig } from '@platform/brands';
import { FIND_LINK, requestsLinkValue, tashkentDate, tashkentTime, type Trip } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { News } from '../../notifications';
import { appButton } from '../../../shared/telegram/open-button';
import { newsFoot, newsHead, newsRoute, tripLine } from '../../../shared/telegram/route-news';

const { t } = createI18n(DEFAULT_LOCALE);

type Wiring = {
  readonly brand: BrandConfig;
  readonly placeName: (id: string) => Promise<string>;
  readonly show: (news: News) => Promise<void>;
  readonly now: () => number;
};

// A new trip of a saved driver comes with ♥ in the news card of its route in the passenger bot
// (docs/18, docs/122 rule 4, mockup g68/1); «Hammasini koʻrish» opens the search of its day.
export const favoriteTeller =
  ({ brand, placeName, show, now }: Wiring) =>
  async (passengerIds: readonly number[], trip: Trip) => {
    const [from, to] = await Promise.all([placeName(trip.from), placeName(trip.to)]);
    const find = { name: FIND_LINK, id: requestsLinkValue(trip.from, trip.to, tashkentDate(trip.departAt)) };
    const line = tripLine(
      { ...trip, name: trip.driver.firstName, time: tashkentTime(trip.departAt), seats: trip.seatsLeft },
      { favorite: true },
      now(),
    );
    for (const chatId of passengerIds)
      await show({
        bot: 'passenger',
        chatId,
        route: newsRoute(trip.from, trip.to),
        head: newsHead('trips', from, to),
        foot: newsFoot('trips'),
        line,
        markup: { inline_keyboard: [[appButton(brand, 'passenger', t('bot.news.all'), find)]] },
      });
  };
