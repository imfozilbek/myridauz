import type { BrandConfig } from '@platform/brands';
import { botStartLink, formatPlate, type Booking, type Trip } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { passengerValue, withValue } from '../../../shared/share/value-lines';
import { tripTimeText } from '../../../shared/telegram/trip-time';
import type { ShareTexts, ShareUpdate } from '../application/ports';

const { t, formatDate } = createI18n(DEFAULT_LOCALE);
const UPDATE_TEXT = {
  boarded: 'bot.share.boarded',
  arrived: 'bot.share.arrived',
  cancelled: 'bot.share.cancelled',
} as const satisfies Record<Exclude<ShareUpdate, 'retimed'>, string>;
// A range: «08:00 dan 10:00 gacha yoʻlga chiqadi» (G90, docs/216).
const retimed = (name: string, trip: Pick<Trip, 'departAt' | 'departUntil'>) =>
  t(trip.departUntil === null ? 'bot.share.retimed' : 'bot.share.retimedRange', {
    name,
    date: formatDate(new Date(trip.departAt)),
    time: tripTimeText(trip),
  });

const carOf = (booking: Booking) => {
  const { car } = booking.trip.driver;
  return `${car.make} ${car.model}`;
};
const plateOf = (booking: Booking) => (booking.plate ? formatPlate(booking.plate) : '');

// The buttons of the card: follow the trip; «Men ham yoʻlga chiqaman» with the mark of the loop
// «Yaqinlarimga» (G69, docs/123), the start of the passenger bot.
export const cardWords = (bot: string, via: string | null) => ({
  title: t('bot.share.title'),
  button: t('bot.share.follow'),
  ...(via ? { second: { text: t('share.follow.join'), url: botStartLink(bot, via) } } : {}),
});

// The card and the messages close people get (docs/43): names, the car, never a phone. The last lines
// call them to the brand too (G69, docs/123 loop 4) and say why (G88, docs/193).
export const shareTexts = (brand: BrandConfig, placeName: (id: string) => Promise<string>): ShareTexts => {
  const invited = (card: string) =>
    withValue(card, `${t('bot.share.invite', { brand: brand.name })}\n${passengerValue()}`);
  return {
    card: async (booking) =>
      invited(
        t('bot.share.card', {
          name: booking.passenger.firstName,
          brand: brand.name,
          from: await placeName(booking.trip.from),
          to: await placeName(booking.trip.to),
          date: formatDate(new Date(booking.trip.departAt)),
          time: tripTimeText(booking.trip),
          car: carOf(booking),
          plate: plateOf(booking),
          driver: booking.trip.driver.firstName,
        }),
      ),
    driverCard: async (trip) =>
      invited(
        t('bot.share.driverCard', {
          name: trip.driverName,
          brand: brand.name,
          from: await placeName(trip.from),
          to: await placeName(trip.to),
          date: formatDate(new Date(trip.departAt)),
          time: tripTimeText(trip),
          car: `${trip.car.make} ${trip.car.model}`,
          plate: formatPlate(trip.plate),
        }),
      ),
    cancelled: () => t('bot.share.cancelled'),
    retimed,
    update: (booking, update) =>
      update === 'retimed'
        ? retimed(booking.passenger.firstName, booking.trip)
        : t(UPDATE_TEXT[update], {
            name: booking.passenger.firstName,
            car: carOf(booking),
            plate: plateOf(booking),
          }),
  };
};
