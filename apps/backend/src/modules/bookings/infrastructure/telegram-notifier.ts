import { appHost, type BrandConfig } from '@platform/brands';
import { chatKeyOfOffer, formatPlate, type Booking, type ChatSystemEvent } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { NotificationJob } from '../../notifications';
import type { BookingNotifier } from '../application/ports';

const { t, formatDate, formatTime } = createI18n(DEFAULT_LOCALE);

type Wiring = {
  readonly brand: BrandConfig;
  readonly notify: (jobs: readonly NotificationJob[]) => Promise<void>;
  readonly system: (key: string, event: ChatSystemEvent) => Promise<void>;
  readonly placeName: (id: string) => Promise<string>;
  readonly closeOnes: (booking: Booking, update: 'boarded' | 'arrived' | 'cancelled') => Promise<void>;
  // A view carries public ids; the bot writes to the Telegram ID behind one (docs/65 A3).
  readonly telegramId: (publicId: string) => Promise<number | undefined>;
};

// The bots tell the other side through the queue (docs/07, docs/03): names only, never a phone
// or a username. The chat of the booking gets a line about it too.
export function telegramNotifier(wiring: Wiring): BookingNotifier {
  const { brand, notify, system, placeName, closeOnes, telegramId } = wiring;
  const open = (app: 'passenger' | 'driver') => ({
    inline_keyboard: [[{ text: t('bot.open'), web_app: { url: `https://${appHost(brand, app)}` } }]],
  });
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
    send('driver', booking.trip.driver.id, text, { markup: open('driver') });
  const toPassenger = (booking: Booking, text: string) =>
    send('passenger', booking.passenger.id, text, { markup: open('passenger') });
  return {
    requested: async (booking) => {
      await system(booking.chatKey, 'requested');
      await toDriver(booking, t('bot.booking.requested', await about(booking)));
    },
    confirmed: async (booking) => {
      await system(booking.chatKey, 'confirmed');
      const { car } = booking.trip.driver;
      const text = t('bot.booking.confirmed', {
        ...(await about(booking)),
        car: `${car.make} ${car.model}`,
        plate: booking.plate ? formatPlate(booking.plate) : '',
      });
      // No button: the passenger answers this very message with the pickup point (docs/14).
      await send('passenger', booking.passenger.id, text, {
        after: { type: 'pickup', bookingId: booking.id },
      });
    },
    declined: async (booking) => {
      await system(booking.chatKey, 'declined');
      await toPassenger(booking, t('bot.booking.declined', await about(booking)));
    },
    cancelled: async (booking, by) => {
      await system(booking.chatKey, 'cancelled');
      await closeOnes(booking, 'cancelled');
      if (by === 'passenger')
        await toDriver(booking, t('bot.booking.cancelledByPassenger', await about(booking)));
      else await toPassenger(booking, t('bot.booking.cancelledByDriver', await about(booking)));
    },
    offered: async (passengerId, offerId) => {
      await system(chatKeyOfOffer(offerId), 'offered');
      await notify([
        { bot: 'passenger', chatId: passengerId, text: t('bot.offer.new'), markup: open('passenger') },
      ]);
    },
    offerAnswered: async (driverId, accepted, offerId) => {
      if (!accepted) await system(chatKeyOfOffer(offerId), 'declined');
      const text = t(accepted ? 'bot.offer.accepted' : 'bot.offer.declined');
      await notify([{ bot: 'driver', chatId: driverId, text, markup: open('driver') }]);
    },
    progress: (booking, step) => closeOnes(booking, step),
  };
}
