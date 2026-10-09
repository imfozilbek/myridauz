import type { BrandConfig } from '@platform/brands';
import {
  BOOKING_LINK,
  OFFER_LINK,
  type AppLink,
  type Booking,
  type ChatSystemEvent,
} from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { NotificationJob } from '../../notifications';
import { openButton } from '../../../shared/telegram/open-button';
import type { BookingNotifier } from '../application/ports';
import type { PassengerNews } from './passenger-news';

const { t, formatDate, formatMoney, formatTime } = createI18n(DEFAULT_LOCALE);

type Wiring = {
  readonly brand: BrandConfig;
  readonly notify: (jobs: readonly NotificationJob[]) => Promise<void>;
  readonly system: (key: string, event: ChatSystemEvent) => Promise<void>;
  readonly placeName: (id: string) => Promise<string>;
  readonly closeOnes: (booking: Booking, update: 'boarded' | 'arrived' | 'cancelled') => Promise<void>;
  // A view carries public ids; the bot writes to the Telegram ID behind one (docs/65 A3).
  readonly telegramId: (publicId: string) => Promise<number | undefined>;
  // The passenger's seat lives in one card of the passenger bot (G68, docs/122).
  readonly passenger: PassengerNews;
};

// The bots tell the other side through the queue (docs/07, docs/03): names only, never a phone
// or a username. The chat of the booking gets a line about it too. The passenger's seat is one live
// card with a ring under it when the passenger has to act (G68).
export function telegramNotifier(wiring: Wiring): BookingNotifier {
  const { brand, notify, system, placeName, closeOnes, telegramId, passenger } = wiring;
  const open = (app: 'passenger' | 'driver', link?: AppLink) => openButton(brand, app, t('bot.open'), link);
  const onBooking = (booking: Booking) => ({ name: BOOKING_LINK, id: booking.id });
  const about = async (booking: Booking) => ({
    from: await placeName(booking.trip.from),
    to: await placeName(booking.trip.to),
    date: formatDate(new Date(booking.trip.departAt)),
    time: formatTime(new Date(booking.trip.departAt)),
    name: booking.passenger.firstName,
    seats: String(booking.seats),
  });
  const send = async (bot: 'passenger' | 'driver', publicId: string, text: string, after?: object) => {
    const chatId = await telegramId(publicId);
    if (chatId !== undefined) await notify([{ bot, chatId, text, ...after }]);
  };
  const toDriver = (booking: Booking, text: string) =>
    send('driver', booking.trip.driver.id, text, { markup: open('driver', onBooking(booking)) });
  return {
    requested: async (booking) => {
      await system(booking.chatKey, 'requested');
      // Until when the driver answers (docs/89 D1).
      const answerBy = new Date(booking.expiresAt);
      const deadline = { answerDate: formatDate(answerBy), answerTime: formatTime(answerBy) };
      await toDriver(booking, t('bot.booking.requested', { ...(await about(booking)), ...deadline }));
      // The passenger asked: the card comes quietly, nobody rings about one's own step (docs/122).
      await passenger(booking);
    },
    confirmed: async (booking) => {
      await system(booking.chatKey, 'confirmed');
      await passenger(booking, 'confirmed');
    },
    declined: async (booking) => {
      await system(booking.chatKey, 'declined');
      await passenger(booking, 'declined');
    },
    expired: async (booking) => {
      await passenger(booking, 'expired');
      // The driver hears it too: the seat is free again (docs/89 S11).
      await toDriver(booking, t('bot.booking.expiredDriver', await about(booking)));
    },
    cancelled: async (booking, by) => {
      await system(booking.chatKey, 'cancelled');
      await closeOnes(booking, 'cancelled');
      if (by === 'driver') return passenger(booking, 'cancelledByDriver');
      await passenger(booking);
      await toDriver(booking, t('bot.booking.cancelledByPassenger', await about(booking)));
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
    offerAnswered: async (driverId, accepted, offer) => {
      if (!accepted) await system(offer.chatKey, 'declined');
      const text = t(accepted ? 'bot.offer.accepted' : 'bot.offer.declined');
      const markup = open('driver', { name: OFFER_LINK, id: offer.id });
      await notify([{ bot: 'driver', chatId: driverId, text, markup }]);
    },
    progress: async (booking, step) => {
      await closeOnes(booking, step);
      await passenger(booking);
    },
    came: async (booking) => toDriver(booking, t('bot.booking.came', await about(booking))),
    driverCame: (booking) => passenger(booking, 'driverCame'),
    tripRetimed: (booking) => passenger(booking, 'retimed'),
  };
}
