import type { BrandConfig } from '@platform/brands';
import {
  BOOKING_LINK,
  chatKeyOfOffer,
  FIND_LINK,
  formatPlate,
  OFFER_LINK,
  requestsLinkValue,
  tashkentDate,
  type AppLink,
  type Booking,
  type ChatSystemEvent,
} from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { NotificationJob } from '../../notifications';
import { openButton } from '../../../shared/telegram/open-button';
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
  const toPassenger = (booking: Booking, text: string) =>
    send('passenger', booking.passenger.id, text, { markup: open('passenger', onBooking(booking)) });
  // A seat that ended: the button leads to the trips of the same route and day (docs/89 S10).
  const findOther = ({ trip }: Booking) =>
    openButton(brand, 'passenger', t('bot.findOther'), {
      name: FIND_LINK,
      id: requestsLinkValue(trip.from, trip.to, tashkentDate(trip.departAt)),
    });
  const lostSeat = (booking: Booking, text: string) =>
    send('passenger', booking.passenger.id, text, { markup: findOther(booking) });
  return {
    requested: async (booking) => {
      await system(booking.chatKey, 'requested');
      // Until when the driver answers (docs/89 D1).
      const answerBy = new Date(booking.expiresAt);
      const deadline = { answerDate: formatDate(answerBy), answerTime: formatTime(answerBy) };
      await toDriver(booking, t('bot.booking.requested', { ...(await about(booking)), ...deadline }));
    },
    confirmed: async (booking) => {
      await system(booking.chatKey, 'confirmed');
      const { car } = booking.trip.driver;
      const text = t('bot.booking.confirmed', {
        ...(await about(booking)),
        car: `${car.make} ${car.model}`,
        plate: booking.plate ? formatPlate(booking.plate) : '',
      });
      await toPassenger(booking, text);
    },
    declined: async (booking) => {
      await system(booking.chatKey, 'declined');
      await lostSeat(booking, t('bot.booking.declined', await about(booking)));
    },
    expired: async (booking) => {
      const facts = await about(booking);
      await lostSeat(booking, t('bot.booking.expired', facts));
      // The driver hears it too: the seat is free again (docs/89 S11).
      await toDriver(booking, t('bot.booking.expiredDriver', facts));
    },
    cancelled: async (booking, by) => {
      await system(booking.chatKey, 'cancelled');
      await closeOnes(booking, 'cancelled');
      if (by === 'passenger')
        await toDriver(booking, t('bot.booking.cancelledByPassenger', await about(booking)));
      else await lostSeat(booking, t('bot.booking.cancelledByDriver', await about(booking)));
    },
    offered: async (passengerId, offerId) => {
      await system(chatKeyOfOffer(offerId), 'offered');
      await notify([
        {
          bot: 'passenger',
          chatId: passengerId,
          text: t('bot.offer.new'),
          markup: open('passenger', { name: OFFER_LINK, id: offerId }),
        },
      ]);
    },
    offerAnswered: async (driverId, accepted, offerId) => {
      if (!accepted) await system(chatKeyOfOffer(offerId), 'declined');
      const text = t(accepted ? 'bot.offer.accepted' : 'bot.offer.declined');
      const markup = open('driver', { name: OFFER_LINK, id: offerId });
      await notify([{ bot: 'driver', chatId: driverId, text, markup }]);
    },
    progress: (booking, step) => closeOnes(booking, step),
  };
}
