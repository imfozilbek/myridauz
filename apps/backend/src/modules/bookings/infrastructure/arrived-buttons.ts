import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';

const { t } = createI18n(DEFAULT_LOCALE);

// «arrived:<booking>:yes» and «arrived:<booking>:no» under «Yetib keldingizmi?» (G46, docs/43).
export const ARRIVED_PREFIX = 'arrived';

export const arrivedButtons = (bookingId: string) => ({
  markup: {
    inline_keyboard: [
      [{ text: t('bookings.arrivedAsk.yes'), callback_data: `${ARRIVED_PREFIX}:${bookingId}:yes` }],
      [{ text: t('bookings.arrivedAsk.later'), callback_data: `${ARRIVED_PREFIX}:${bookingId}:no` }],
    ],
  },
});
