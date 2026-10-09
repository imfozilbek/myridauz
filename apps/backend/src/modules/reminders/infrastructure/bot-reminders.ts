import type { BrandConfig } from '@platform/brands';
import { MY_TRIP_LINK, type Trip } from '@platform/contracts';
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
};

const KEYS = { day: 'bot.reminder.driverDay', soon: 'bot.reminder.driverSoon' } as const;

// The driver bot reminds a driver (docs/02); "Ochish" opens the trip. The passenger's reminders
// are the trip card of the passenger bot (G68).
export function botReminders({
  brand,
  placeName,
  send,
  telegramId,
}: Wiring): RemindersDeps['tell']['driver'] {
  const about = async (trip: Trip) => ({
    from: await placeName(trip.from),
    to: await placeName(trip.to),
    date: formatDate(new Date(trip.departAt)),
    time: formatTime(new Date(trip.departAt)),
  });
  return async (trip, riders, kind) => {
    const chatId = await telegramId(trip.driver.id);
    const text = t(KEYS[kind], { ...(await about(trip)), count: String(riders) });
    const markup = openButton(brand, 'driver', t('bot.open'), { name: MY_TRIP_LINK, id: trip.id });
    if (chatId !== undefined) await send([{ bot: 'driver', chatId, text, markup }]);
  };
}
