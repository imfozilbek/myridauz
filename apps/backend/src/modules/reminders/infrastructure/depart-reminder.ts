import type { BrandConfig } from '@platform/brands';
import { MY_TRIP_LINK } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { NotificationJob } from '../../notifications';
import { openButton } from '../../../shared/telegram/open-button';
import type { LateTrip } from '../application/departures';

const { t } = createI18n(DEFAULT_LOCALE);

// The driver bot asks about the departure (G63); «Ochish» opens the trip with «Yoʻlga chiqdim» on it,
// right on the trip, never only the main screen (docs/65 B5).
export const departReminder =
  (brand: BrandConfig, send: (jobs: readonly NotificationJob[]) => Promise<void>) =>
  async (trip: LateTrip): Promise<void> => {
    const markup = openButton(brand, 'driver', t('bot.open'), { name: MY_TRIP_LINK, id: trip.id });
    await send([{ bot: 'driver', chatId: trip.driverId, text: t('bot.trip.departReminder'), markup }]);
  };
