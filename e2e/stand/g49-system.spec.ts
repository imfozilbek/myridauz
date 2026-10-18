import { expect, test } from '../crash-guard';
import { SAMARQAND, TO_SAMARQAND, walletOf } from './g27-kit';
import { answer, book, cancelMine, CHILONZOR, publishTrip } from './market-kit';
import { t } from './screen-tour';
import { approvedDriver, register } from './seed';
import { openAs, type Person } from './stand-kit';
import { blockBots, botMessages, clearBotMessages, refusedMessages } from './stand-tools';

// G49 (docs/80 S07, S51, docs/81 A07): what goes on around a booking on the whole local Rida.
test.describe.configure({ mode: 'serial' });
const person = (id: number, name: string): Person => ({ id, name, phone: `998901110${id - 900000}` });
const SAIDA = person(900921, 'Saida');
const NODIR = person(900922, 'Nodir');
const GULI = person(900923, 'Guli');
const SANJAR = person(900924, 'Sanjar');
const MUNISA = person(900925, 'Munisa');
const RAHIM = person(900926, 'Rahim');
// Longer than the moment a signal of the personal channel takes to reach an open screen (docs/64).
const SIGNAL_MS = 3_000;

const bookedSeat = async (driver: Person, plate: string, passenger: Person) => {
  await approvedDriver(driver, plate);
  await register('passenger', passenger, 'female');
  const trip = await publishTrip(driver, CHILONZOR, SAMARQAND, 'door');
  return book(passenger, trip, { seats: 1, mode: 'door', ...TO_SAMARQAND });
};

test('S07. a person blocked the bot: her messages are dropped, her seat and the rest of the app go on', async () => {
  await register('passenger', SAIDA, 'female');
  await blockBots(SAIDA.id);
  const refused = await refusedMessages();
  await clearBotMessages();
  const seat = await bookedSeat(NODIR, '01G922ND', SAIDA);
  expect((await answer(NODIR, seat.id, 'confirm')).status).toBe('confirmed');
  await expect.poll(refusedMessages).toBeGreaterThan(refused);
  const sent = await botMessages();
  expect(sent.some((m) => m.chatId === NODIR.id)).toBe(true);
  expect(sent.some((m) => m.chatId === SAIDA.id)).toBe(false);
});

// The screen of a passenger missed the signal of the confirmation (the app was in the background);
// coming back to the app reads it again (docs/64, G43).
test('S51. the app missed the signal in the background: back in it, the screen is fresh', async ({
  page,
}) => {
  const seat = await bookedSeat(SANJAR, '01G924SJ', GULI);
  let away = false;
  await page.routeWebSocket('**/feed/socket**', (socket) => {
    const server = socket.connectToServer();
    server.onMessage((message) => (away ? undefined : socket.send(message)));
  });
  await openAs(page, 'passenger', GULI);
  await page.getByText(t('common.myTrips')).click();
  await expect(page.getByText(t('bookings.status.requested'))).toBeVisible();
  away = true;
  await answer(SANJAR, seat.id, 'confirm');
  await page.waitForTimeout(SIGNAL_MS);
  await expect(page.getByText(t('bookings.status.requested'))).toBeVisible();
  away = false;
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await expect(page.getByText(t('bookings.confirmed.title'))).toBeVisible();
});

// A pair agrees and the passenger cancels before the departure: the commission goes back, the
// driver hears it (docs/12). Rida sees it only by the masked phones of the chat and «Kelmadi»
// (docs/81 A07); a pair that does it again and again is a finding of G49 (docs/83 N).
test('A07. book, confirm and cancel by agreement: possible, the commission comes back', async () => {
  const seat = await bookedSeat(RAHIM, '01G926RH', MUNISA);
  const start = await walletOf(RAHIM);
  const { commission } = await answer(RAHIM, seat.id, 'confirm');
  expect((await walletOf(RAHIM)).bonus).toBe(start.bonus - commission);
  await cancelMine(MUNISA, seat.id);
  await expect.poll(async () => (await walletOf(RAHIM)).bonus).toBe(start.bonus);
});
