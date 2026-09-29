import { appHost, type BrandConfig } from '@platform/brands';
import { formatPlate, type Booking } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { sendText, type Fetch } from '../../../shared/telegram/telegram-api';
import type { BookingNotifier } from '../application/ports';

const { t, formatDate, formatTime } = createI18n(DEFAULT_LOCALE);

type Wiring = {
  readonly fetch: Fetch;
  readonly brand: BrandConfig;
  readonly passengerToken: string | undefined;
  readonly driverToken: string | undefined;
  readonly placeName: (id: string) => Promise<string>;
};

// The bots tell the other side (docs/07): names only, never a phone or a username.
// A person who never opened the bot gets nothing; the booking works anyway.
export function telegramNotifier({
  fetch,
  brand,
  passengerToken,
  driverToken,
  placeName,
}: Wiring): BookingNotifier {
  const open = (app: 'passenger' | 'driver') => ({
    inline_keyboard: [[{ text: t('bot.open'), web_app: { url: `https://${appHost(brand, app)}` } }]],
  });
  const send = async (token: string | undefined, chatId: number, text: string, markup?: object) => {
    if (!token) return null;
    try {
      return (await sendText(fetch, token, chatId, text, markup)) ?? null;
    } catch (error) {
      console.warn(String(error));
      return null;
    }
  };
  const about = async (booking: Booking) => ({
    from: await placeName(booking.trip.from),
    to: await placeName(booking.trip.to),
    date: formatDate(new Date(booking.trip.departAt)),
    time: formatTime(new Date(booking.trip.departAt)),
    name: booking.passenger.firstName,
    seats: String(booking.seats),
  });
  const toDriver = (booking: Booking, text: string) =>
    send(driverToken, booking.trip.driver.id, text, open('driver'));
  const toPassenger = (booking: Booking, text: string) =>
    send(passengerToken, booking.passenger.id, text, open('passenger'));
  return {
    requested: async (booking) =>
      void (await toDriver(booking, t('bot.booking.requested', await about(booking)))),
    confirmed: async (booking) => {
      const { car } = booking.trip.driver;
      const text = t('bot.booking.confirmed', {
        ...(await about(booking)),
        car: `${car.make} ${car.model}`,
        plate: booking.plate ? formatPlate(booking.plate) : '',
      });
      // No button: the passenger answers this very message with the pickup point (docs/14).
      return send(passengerToken, booking.passenger.id, text);
    },
    declined: async (booking) =>
      void (await toPassenger(booking, t('bot.booking.declined', await about(booking)))),
    cancelled: async (booking, by) => {
      if (by === 'passenger')
        await toDriver(booking, t('bot.booking.cancelledByPassenger', await about(booking)));
      else await toPassenger(booking, t('bot.booking.cancelledByDriver', await about(booking)));
    },
    offered: async (passengerId) =>
      void (await send(passengerToken, passengerId, t('bot.offer.new'), open('passenger'))),
    offerAnswered: async (driverId, accepted) =>
      void (await send(
        driverToken,
        driverId,
        t(accepted ? 'bot.offer.accepted' : 'bot.offer.declined'),
        open('driver'),
      )),
  };
}
