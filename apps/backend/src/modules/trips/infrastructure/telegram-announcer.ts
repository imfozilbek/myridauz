import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { sendText, type Fetch } from '../../../shared/telegram/telegram-api';
import type { TripRecord } from '../domain/trip';

const { t, formatMoney, formatDate, formatTime } = createI18n(DEFAULT_LOCALE);

type Wiring = {
  readonly fetch: Fetch;
  readonly driverToken: string | undefined;
  readonly placeName: (id: string) => Promise<string>;
};

// The driver bot tells the driver the trip is published. A driver who has never opened the bot
// gets nothing: the trip is published anyway.
export const telegramAnnouncer =
  ({ fetch, driverToken, placeName }: Wiring) =>
  async (trip: TripRecord): Promise<void> => {
    if (!driverToken) return;
    const text = t('bot.trip.published', {
      from: await placeName(trip.from),
      to: await placeName(trip.to),
      date: formatDate(new Date(trip.departAt)),
      time: formatTime(new Date(trip.departAt)),
      price: formatMoney(trip.price),
    });
    try {
      await sendText(fetch, driverToken, trip.driverId, text);
    } catch (error) {
      console.warn(JSON.stringify({ event: 'trip_announce_failed', message: String(error) }));
    }
  };
