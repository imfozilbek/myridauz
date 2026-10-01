import { expect } from '@playwright/test';
import { createBookingsClient, createMarketClient, createWalletClient } from '@platform/api-client';
import { tashkentDate, type Booking, type OfferAction } from '@platform/contracts';
import { CHILONZOR } from './market-kit';
import { OWNER } from './people';
import { signedAs, type Person } from './stand-kit';
import { botMessages } from './stand-tools';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';

// The tools of the G27 scenarios (docs/76 … 83): the route Toshkent → Samarqand, the error code a
// call ends with, what a bot told a person, the wallet of a driver.
export const SAMARQAND = '1718401';
export const TO_SAMARQAND = {
  pickup: { lat: 41.2847, lng: 69.2152 },
  dropoff: { lat: 39.6542, lng: 66.9597 },
} as const;
export const MINUTE = 60 * 1000;

// The code of the API error a call ends with, or «ok».
export const outcome = (call: Promise<unknown>): Promise<string> =>
  call.then(
    () => 'ok',
    (error: Error) => error.message,
  );

// The message one bot sent to one person that has these words, waited for: the bots send through a
// queue, so a message of an earlier step may come later.
export async function toldBy(bot: string, person: Person, words: string): Promise<string> {
  const find = async () =>
    (await botMessages()).find((m) => m.bot === bot && m.chatId === person.id && m.text.includes(words))
      ?.text ?? '';
  await expect.poll(find, { message: `${bot} bot tells ${person.name}: ${words}` }).not.toBe('');
  return find();
}

export const myBookings = async (passenger: Person): Promise<Booking[]> =>
  createBookingsClient(await signedAs('passenger', passenger)).myBookings();
export const bookingOf = async (passenger: Person, id: string): Promise<Booking | undefined> =>
  (await myBookings(passenger)).find((booking) => booking.id === id);

export const walletOf = async (driver: Person) => createWalletClient(await signedAs('driver', driver)).mine();

// The owner sets the bonus of a driver to an amount by a hand correction (docs/12).
export async function setBonus(driver: Person, amount: number): Promise<void> {
  const owner = createWalletClient(await signedAs('admin', OWNER));
  const row = (await owner.all()).find((wallet) => wallet.firstName === driver.name);
  if (!row) throw new Error(`stand: no wallet of ${driver.name}`);
  if (row.bonus === amount) return;
  await owner.adjust(row.driverId, { balance: 'bonus', amount: amount - row.bonus, reason: 'stand G27' });
}

// The longest fixed words of a bot message, between its values: enough to know which message it is.
const { t } = createI18n(DEFAULT_LOCALE);
const MARK = '\u0000';
const anyValue = new Proxy({}, { has: () => true, get: () => MARK });
export const wordsOf = (key: Parameters<typeof t>[0]): string =>
  (t(key, anyValue).split(MARK)[0] ?? '').trim();

// Requests and offers (docs/35): a passenger asks for a day, a driver offers a time and a price.
const HOUR = 60 * MINUTE;
const TASHKENT = 5 * HOUR;
const DAY = 24 * HOUR;
export const tomorrow = () => tashkentDate(Date.now() + DAY);
// 09:00 in Tashkent on that day.
const nineOn = (date: string) => Date.parse(`${date}T09:00:00Z`) - TASHKENT;

export async function askRide(passenger: Person, date = tomorrow()) {
  const market = createMarketClient(await signedAs('passenger', passenger));
  const { price } = await market.recommend(CHILONZOR, SAMARQAND);
  const input = { from: CHILONZOR, to: SAMARQAND, date, seats: 1, price, pickupMode: 'door' as const };
  return market.publishRequest({ ...input, ...TO_SAMARQAND });
}
export async function offerOn(driver: Person, requestId: string, date = tomorrow()) {
  const market = createMarketClient(await signedAs('driver', driver));
  const { price } = await market.recommend(CHILONZOR, SAMARQAND);
  return createBookingsClient(await signedAs('driver', driver)).sendOffer(requestId, {
    departAt: nineOn(date),
    price,
  });
}
export const answerOffer = async (passenger: Person, offerId: string, action: OfferAction) =>
  createBookingsClient(await signedAs('passenger', passenger)).answerOffer(offerId, action);
