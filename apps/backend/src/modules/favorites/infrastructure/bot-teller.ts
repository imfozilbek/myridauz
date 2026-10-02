import { appHost, type BrandConfig } from '@platform/brands';
import type { Trip } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { NotificationJob } from '../../notifications';

const { t, formatMoney, formatDate, formatTime } = createI18n(DEFAULT_LOCALE);

type Wiring = {
  readonly brand: BrandConfig;
  readonly placeName: (id: string) => Promise<string>;
  readonly send: (jobs: readonly NotificationJob[]) => Promise<void>;
  // «Bot xabarlari» off in the profile: no news of saved drivers (docs/88 L1).
  readonly wantsNews: (userId: number) => Promise<boolean>;
};

// The passenger bot tells about a new trip of a saved driver; the button opens the trip (docs/18).
export const favoriteTeller =
  ({ brand, placeName, send, wantsNews }: Wiring) =>
  async (passengerIds: readonly number[], trip: Trip) => {
    const day = new Date(trip.departAt);
    const text = t('bot.favorite.trip', {
      name: trip.driver.firstName,
      from: await placeName(trip.from),
      to: await placeName(trip.to),
      date: formatDate(day),
      time: formatTime(day),
      seats: String(trip.seatsLeft),
      price: formatMoney(trip.price),
    });
    const url = `https://${appHost(brand, 'passenger')}/?trip=${trip.id}`;
    const markup = { inline_keyboard: [[{ text: t('bot.subscription.open'), web_app: { url } }]] };
    const wanting = [];
    for (const id of passengerIds) if (await wantsNews(id)) wanting.push(id);
    await send(wanting.map((chatId) => ({ bot: 'passenger' as const, chatId, text, markup })));
  };
