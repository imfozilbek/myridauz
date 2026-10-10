import type { BrandConfig } from '@platform/brands';
import { formatPlate, type Booking } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { ShareTexts, ShareUpdate } from '../application/ports';

const { t, formatDate, formatTime } = createI18n(DEFAULT_LOCALE);
const UPDATE_TEXT = {
  boarded: 'bot.share.boarded',
  arrived: 'bot.share.arrived',
  cancelled: 'bot.share.cancelled',
} as const satisfies Record<Exclude<ShareUpdate, 'retimed'>, string>;
const retimed = (name: string, departAt: number) =>
  t('bot.share.retimed', {
    name,
    date: formatDate(new Date(departAt)),
    time: formatTime(new Date(departAt)),
  });

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
  driverCard: async (trip) =>
    t('bot.share.driverCard', {
      name: trip.driverName,
      brand: brand.name,
      from: await placeName(trip.from),
      to: await placeName(trip.to),
      date: formatDate(new Date(trip.departAt)),
      time: formatTime(new Date(trip.departAt)),
      car: `${trip.car.make} ${trip.car.model}`,
      plate: formatPlate(trip.plate),
    }),
  cancelled: () => t('bot.share.cancelled'),
  retimed,
  update: (booking, update) =>
    update === 'retimed'
      ? retimed(booking.passenger.firstName, booking.trip.departAt)
      : t(UPDATE_TEXT[update], {
          name: booking.passenger.firstName,
          car: carOf(booking),
          plate: plateOf(booking),
        }),
});
