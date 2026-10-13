import { expect, test } from '../crash-guard';
import { channelOf, loadBrand } from '../../brands/index';
import { createChannelsClient, createComfortClient, createMarketClient } from '@platform/api-client';
import { showChat } from './bot-chat';
import { channelChat } from './first-contact-kit';
import { answer, book, CHILONZOR, publishTrip } from './market-kit';
import { confirmedSeat, MINUTE, moveTrip, SAMARQAND, toldBy, TO_SAMARQAND, wordsOf } from './g27-kit';
import { JAHONGIR, NARGIZA } from './people';
import { signedAs } from './stand-kit';
import { botMessages, clearBotMessages, runCron, standRows, standSql } from './stand-tools';

// The channels of the directions and the reasons to come back (docs/80 S60 … S62, docs/77 P51, P52): a
// trip is posted where people of its route read, its post follows the seats; a saved driver brings
// the new trips; the history keeps the rides.
test.describe.configure({ mode: 'serial' });
const HOUR = 60 * MINUTE;
// Toshkent has no channel of its own (docs/15): a trip to Samarqand goes to the channels of Samarqand.
const ZONE = channelOf(loadBrand(), SAMARQAND);
const CHANNEL = ZONE?.chat ?? '';
const posts = async (method: string) =>
  (await botMessages()).filter((m) => m.chat === CHANNEL && m.method === method);

test('S60, S61, S62. a new trip is posted, the post follows a full car and a cancel', async ({ page }) => {
  await clearBotMessages();
  const trip = await publishTrip(JAHONGIR, CHILONZOR, SAMARQAND, 'door');
  await expect.poll(async () => (await posts('sendMessage')).length).toBe(1);
  const seat = await book(NARGIZA, trip, { seats: trip.seats, mode: 'door', ...TO_SAMARQAND });
  await answer(JAHONGIR, seat.id, 'confirm');
  await expect.poll(async () => (await posts('editMessageText')).length).toBeGreaterThanOrEqual(1);
  const edits = (await posts('editMessageText')).length;
  // The post of a full car as the channel shows it, next to the mockup g68/5 for the owner.
  const shown = (await botMessages()).filter((m) => m.chat === CHANNEL);
  if (ZONE) await showChat(page, channelChat(ZONE), shown);
  await page.screenshot({ path: 'screenshots/stand/g68/9-channel-full.png', fullPage: true });
  await createMarketClient(await signedAs('driver', JAHONGIR)).cancelTrip(trip.id);
  await expect.poll(async () => (await posts('editMessageText')).length).toBeGreaterThan(edits);
});

test('P51. a saved driver: the new trip comes by the bot', async () => {
  const first = await publishTrip(JAHONGIR, CHILONZOR, SAMARQAND, 'door');
  await createComfortClient(await signedAs('passenger', NARGIZA)).save(first.driver.id);
  // One live trip of a driver (docs/172): the next one comes after the first is over.
  await createMarketClient(await signedAs('driver', JAHONGIR)).cancelTrip(first.id);
  await publishTrip(JAHONGIR, CHILONZOR, SAMARQAND, 'door');
  await toldBy('passenger', NARGIZA, wordsOf('bot.news.favorite'));
});

test('P52. the history keeps a ride that ended, with whom', async () => {
  const { trip } = await confirmedSeat(JAHONGIR, NARGIZA);
  moveTrip(trip.id, Date.now() - 10 * HOUR, Date.now() - MINUTE);
  await runCron();
  const history = createComfortClient(await signedAs('passenger', NARGIZA));
  const ridden = async () =>
    (await history.history()).some((ride) => ride.from === trip.from && ride.to === trip.to);
  await expect.poll(ridden).toBe(true);
});

// Owner decision 4 (docs/176): the hourly check makes the own link of the app of a channel once, and
// «Kanallar» gives it, so Telegram counts who joined from the app.
test('S76. the check makes the link of the app of a channel, «Kanallar» gives it', async () => {
  await runCron();
  const mine = await createChannelsClient(await signedAs('passenger', NARGIZA)).mine();
  expect(mine.some((channel) => channel.link.startsWith('https://t.me/+stand'))).toBe(true);
});

// docs/180: the Cron brings a bot to the repository, then leaves it alone while it is like it.
test('S77. the look of a bot comes from the repository, a bot like it gets no call', async () => {
  const PASSENGER = "face = 'bot:passenger'";
  const row = () => standRows(`SELECT checked_at, photo_id FROM looks WHERE ${PASSENGER}`)[0];
  const sets = async () =>
    (await botMessages()).filter((m) => m.bot === 'passenger' && m.method.startsWith('setMy'));
  // Never checked: the first of the next round, it gets the picture of the repository.
  standSql(`DELETE FROM looks WHERE ${PASSENGER}`);
  await clearBotMessages();
  await runCron();
  expect((await sets()).map((m) => m.method)).toContain('setMyProfilePhoto');
  expect(String(row()?.photo_id)).toMatch(/^stand-photo-/u);
  // Checked again first: Telegram is like the repository, nothing is set.
  standSql(`UPDATE looks SET checked_at = -1 WHERE ${PASSENGER}`);
  await clearBotMessages();
  await runCron();
  expect(Number(row()?.checked_at)).toBeGreaterThan(0);
  expect(await sets()).toEqual([]);
});
