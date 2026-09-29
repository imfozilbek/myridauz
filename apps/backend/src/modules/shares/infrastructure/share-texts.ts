import type { BrandConfig } from '@platform/brands';
import { formatPlate, type Booking } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { ShareTexts, ShareUpdate } from '../application/ports';

const { t, formatDate, formatTime } = createI18n(DEFAULT_LOCALE);
const UPDATE_TEXT = {
  boarded: 'bot.share.boarded',
  arrived: 'bot.share.arrived',
  cancelled: 'bot.share.cancelled',
} as const satisfies Record<ShareUpdate, string>;

const carOf = (booking: Booking) => {
  const { car } = booking.trip.driver;
  return `${car.make} ${car.model}`;
};
const plateOf = (booking: Booking) => (booking.plate ? formatPlate(booking.plate) : '');

// The card and the messages close people get (docs/43): names, the car, never a phone.
export const shareTexts = (brand: BrandConfig, placeName: (id: string) => Promise<string>): ShareTexts => ({
  card: async (booking) =>
    t('bot.share.card', {
      name: booking.passenger.firstName,
      brand: brand.name,
      from: await placeName(booking.trip.from),
      to: await placeName(booking.trip.to),
      date: formatDate(new Date(booking.trip.departAt)),
      time: formatTime(new Date(booking.trip.departAt)),
      car: carOf(booking),
      plate: plateOf(booking),
      driver: booking.trip.driver.firstName,
    }),
  update: (booking, update) =>
    t(UPDATE_TEXT[update], {
      name: booking.passenger.firstName,
      car: carOf(booking),
      plate: plateOf(booking),
    }),
});
