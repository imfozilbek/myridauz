import type { BrandConfig } from '@platform/brands';
import { OFFER_LINK, type AppLink, type Booking, type ChatSystemEvent } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { NotificationJob } from '../../notifications';
import { openButton } from '../../../shared/telegram/open-button';
import type { BookingNotifier } from '../application/ports';
import type { DriverNews, DriverRing } from './driver-news';
import type { PassengerNews } from './passenger-news';

const { t, formatDate, formatMoney, formatTime } = createI18n(DEFAULT_LOCALE);

type Wiring = {
  readonly brand: BrandConfig;
  readonly notify: (jobs: readonly NotificationJob[]) => Promise<void>;
  readonly system: (key: string, event: ChatSystemEvent) => Promise<void>;
  readonly placeName: (id: string) => Promise<string>;
  readonly closeOnes: (booking: Booking, update: 'boarded' | 'arrived' | 'cancelled') => Promise<void>;
  // The passenger's seat lives in one card of the passenger bot (G68, docs/122).
  readonly passenger: PassengerNews;
  // The driver's trip lives in one card of the driver bot, a request in its own card under it (G68).
  readonly driver: DriverNews;
};

// The bots tell the other side (docs/07, docs/03): names only, never a phone or a username. The
// chat of the booking gets a line about it too. A seat and a trip are live cards of their bots, with
// a ring under them only when the person has to act (G68, docs/122).
export function telegramNotifier(wiring: Wiring): BookingNotifier {
  const { brand, notify, system, placeName, closeOnes, passenger, driver } = wiring;
  const open = (app: 'passenger' | 'driver', link?: AppLink) => openButton(brand, app, t('bot.open'), link);
  // The trip card of the driver follows every change of a booking; about: the booking changed.
  const tripOf = (booking: Booking, ring?: DriverRing) => driver(booking.trip.id, booking.id, ring);
  return {
    requested: async (booking) => {
      await system(booking.chatKey, 'requested');
      // The passenger asked: the card comes quietly, nobody rings about one's own step (docs/122).
      // It goes first: a quick «Qabul qilish» then edits it instead of sending a second one.
      await passenger(booking);
      await tripOf(booking, 'asked');
    },
    confirmed: async (booking, own) => {
      await system(booking.chatKey, 'confirmed');
      await passenger(booking, own ? undefined : 'confirmed');
      await tripOf(booking);
    },
    declined: async (booking) => {
      await system(booking.chatKey, 'declined');
      await passenger(booking, 'declined');
      await tripOf(booking);
    },
    // The seat is free again: the request card of the driver says it burned (docs/89 S11).
    expired: async (booking) => {
      await passenger(booking, 'expired');
      await tripOf(booking);
    },
    cancelled: async (booking, by) => {
      await system(booking.chatKey, 'cancelled');
      await closeOnes(booking, 'cancelled');
      if (by === 'driver') {
        await passenger(booking, 'cancelledByDriver');
        return tripOf(booking);
      }
      await passenger(booking);
      // A confirmed seat gives the commission back: the driver hears it; a request only edits its card.
      await tripOf(booking, booking.confirmedAt === null ? undefined : 'cancelled');
    },
    offered: async (passengerId, offer) => {
      await system(offer.chatKey, 'offered');
      const { firstName, car } = offer.driver;
      const at = new Date(offer.departAt);
      const text = t('bot.offer.new', {
        name: firstName,
        car: `${car.make} ${car.model}`,
        from: await placeName(offer.from),
        to: await placeName(offer.to),
        date: formatDate(at),
        time: formatTime(at),
        price: formatMoney(offer.price),
      });
      const markup = open('passenger', { name: OFFER_LINK, id: offer.id });
      await notify([{ bot: 'passenger', chatId: passengerId, text, markup }]);
    },
    offerAnswered: async (driverId, accepted, offer, booking) => {
      if (accepted) return booking && driver(booking.tripId, booking.id, 'offerAccepted');
      await system(offer.chatKey, 'declined');
      const markup = open('driver', { name: OFFER_LINK, id: offer.id });
      await notify([{ bot: 'driver', chatId: driverId, text: t('bot.offer.declined'), markup }]);
    },
    progress: async (booking, step) => {
      await closeOnes(booking, step);
      await passenger(booking);
      await tripOf(booking);
    },
    came: (booking) => tripOf(booking, 'came'),
    driverCame: (booking) => passenger(booking, 'driverCame'),
    noShow: (booking) => passenger(booking, 'noShow'),
    tripRetimed: (booking) => passenger(booking, 'retimed'),
  };
}
