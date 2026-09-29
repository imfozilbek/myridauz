import { tashkentDate, tashkentTime } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { sendText, type Fetch } from '../../../shared/telegram/telegram-api';
import type { TripRecord } from '../domain/trip';

const { t, formatMoney } = createI18n(DEFAULT_LOCALE);

type Wiring = {
  readonly fetch: Fetch;
  readonly driverToken: string | undefined;
  readonly placeName: (id: string) => Promise<string>;
};

// The driver bot tells the driver the trip is published and asks for the meeting point (docs/14).
// A driver who has never opened the bot gets nothing: the trip is published anyway.
export const telegramAnnouncer =
  ({ fetch, driverToken, placeName }: Wiring) =>
  async (trip: TripRecord): Promise<number | null> => {
    if (!driverToken) return null;
    const text = t('bot.trip.published', {
      from: await placeName(trip.from),
      to: await placeName(trip.to),
      date: tashkentDate(trip.departAt),
      time: tashkentTime(trip.departAt),
      price: formatMoney(trip.price),
    });
    try {
      return (await sendText(fetch, driverToken, trip.driverId, text)) ?? null;
    } catch (error) {
      console.warn(String(error));
      return null;
    }
  };
