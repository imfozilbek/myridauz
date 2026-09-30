import { appHost, type BrandConfig } from '@platform/brands';
import { formatPlate, type Trip } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { NotificationJob } from '../../notifications';
import type { RemindersDeps } from '../application/remind';

const { t, formatDate, formatTime } = createI18n(DEFAULT_LOCALE);

type Wiring = {
  readonly brand: BrandConfig;
  readonly placeName: (id: string) => Promise<string>;
  readonly send: (jobs: readonly NotificationJob[]) => Promise<void>;
  // A view carries public ids; the bot writes to the Telegram ID behind one (docs/65 A3).
  readonly telegramId: (publicId: string) => Promise<number | undefined>;
};

const KEYS = {
  passenger: { day: 'bot.reminder.passengerDay', soon: 'bot.reminder.passengerSoon' },
  driver: { day: 'bot.reminder.driverDay', soon: 'bot.reminder.driverSoon' },
} as const;

// The passenger bot reminds a passenger, the driver bot a driver (docs/02); "Ochish" opens the app.
export function botReminders({ brand, placeName, send, telegramId }: Wiring): RemindersDeps['tell'] {
  const open = (app: 'passenger' | 'driver') => ({
    inline_keyboard: [[{ text: t('bot.open'), web_app: { url: `https://${appHost(brand, app)}` } }]],
  });
  const to = async (bot: 'passenger' | 'driver', publicId: string, text: string) => {
    const chatId = await telegramId(publicId);
    if (chatId !== undefined) await send([{ bot, chatId, text, markup: open(bot) }]);
  };
  const about = async (trip: Trip) => ({
    from: await placeName(trip.from),
    to: await placeName(trip.to),
    date: formatDate(new Date(trip.departAt)),
    time: formatTime(new Date(trip.departAt)),
  });
  return {
    passenger: async (booking, kind) => {
      const { car } = booking.trip.driver;
      const text = t(KEYS.passenger[kind], {
        ...(await about(booking.trip)),
        car: `${car.make} ${car.model}`,
        plate: booking.plate ? formatPlate(booking.plate) : '',
      });
      await to('passenger', booking.passenger.id, text);
    },
    driver: async (trip, riders, kind) => {
      const text = t(KEYS.driver[kind], { ...(await about(trip)), count: String(riders) });
      await to('driver', trip.driver.id, text);
    },
  };
}
