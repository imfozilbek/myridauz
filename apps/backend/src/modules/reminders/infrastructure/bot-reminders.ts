import type { BrandConfig } from '@platform/brands';
import { BOOKING_LINK, formatPlate, MY_TRIP_LINK, type AppLink, type Trip } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { NotificationJob } from '../../notifications';
import { openButton } from '../../../shared/telegram/open-button';
import type { RemindersDeps } from '../application/remind';

const { t, formatDate, formatTime } = createI18n(DEFAULT_LOCALE);

type Wiring = {
  readonly brand: BrandConfig;
  readonly placeName: (id: string) => Promise<string>;
  readonly send: (jobs: readonly NotificationJob[]) => Promise<void>;
  // A view carries public ids; the bot writes to the Telegram ID behind one (docs/65 A3).
  readonly telegramId: (publicId: string) => Promise<number | undefined>;
  // «Bot xabarlari» off in the profile: no reminders (docs/88 L1).
  readonly wantsNews: (userId: number) => Promise<boolean>;
};

const KEYS = {
  passenger: { day: 'bot.reminder.passengerDay', soon: 'bot.reminder.passengerSoon' },
  driver: { day: 'bot.reminder.driverDay', soon: 'bot.reminder.driverSoon' },
} as const;

// The passenger bot reminds a passenger, the driver bot a driver (docs/02); "Ochish" opens the app.
export function botReminders({
  brand,
  placeName,
  send,
  telegramId,
  wantsNews,
}: Wiring): RemindersDeps['tell'] {
  const to = async (bot: 'passenger' | 'driver', publicId: string, text: string, link: AppLink) => {
    const chatId = await telegramId(publicId);
    const markup = openButton(brand, bot, t('bot.open'), link);
    if (chatId !== undefined && (await wantsNews(chatId))) await send([{ bot, chatId, text, markup }]);
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
      await to('passenger', booking.passenger.id, text, { name: BOOKING_LINK, id: booking.id });
    },
    driver: async (trip, riders, kind) => {
      const text = t(KEYS.driver[kind], { ...(await about(trip)), count: String(riders) });
      await to('driver', trip.driver.id, text, { name: MY_TRIP_LINK, id: trip.id });
    },
  };
}
