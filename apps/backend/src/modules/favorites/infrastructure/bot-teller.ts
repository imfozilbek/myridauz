import { appHost, type BrandConfig } from '@platform/brands';
import type { Trip } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { NotificationJob } from '../../notifications';

const { t, formatMoney, formatDate, formatTime } = createI18n(DEFAULT_LOCALE);

type Wiring = {
  readonly brand: BrandConfig;
  readonly placeName: (id: string) => Promise<string>;
  readonly send: (jobs: readonly NotificationJob[]) => Promise<void>;
};

// The passenger bot tells about a new trip of a saved driver; the button opens the trip (docs/18).
export const favoriteTeller =
  ({ brand, placeName, send }: Wiring) =>
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
    await send(passengerIds.map((chatId) => ({ bot: 'passenger' as const, chatId, text, markup })));
  };
