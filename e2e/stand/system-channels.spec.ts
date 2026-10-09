import { expect, test } from '../crash-guard';
import { channelOf, loadBrand } from '../../brands/index';
import { createComfortClient, createMarketClient } from '@platform/api-client';
import { answer, book, CHILONZOR, publishTrip } from './market-kit';
import { confirmedSeat, MINUTE, moveTrip, SAMARQAND, toldBy, TO_SAMARQAND, wordsOf } from './g27-kit';
import { JAHONGIR, NARGIZA } from './people';
import { signedAs } from './stand-kit';
import { botMessages, clearBotMessages, runCron } from './stand-tools';

// The channels of the zones and the reasons to come back (docs/80 S60 … S62, docs/77 P51, P52): a
// trip is posted where people of its route read, its post follows the seats; a saved driver brings
// the new trips; the history keeps the rides.
test.describe.configure({ mode: 'serial' });
const HOUR = 60 * MINUTE;
// Toshkent has no channel of its own (docs/15): a trip to Samarqand goes to the channel of Samarqand.
const CHANNEL = `@${channelOf(loadBrand(), SAMARQAND)?.username ?? ''}`;
const posts = async (method: string) =>
  (await botMessages()).filter((m) => m.chat === CHANNEL && m.method === method);

test('S60, S61, S62. a new trip is posted, the post follows a full car and a cancel', async () => {
  await clearBotMessages();
  const trip = await publishTrip(JAHONGIR, CHILONZOR, SAMARQAND, 'door');
  await expect.poll(async () => (await posts('sendMessage')).length).toBe(1);
  const seat = await book(NARGIZA, trip, { seats: trip.seats, mode: 'door', ...TO_SAMARQAND });
  await answer(JAHONGIR, seat.id, 'confirm');
  await expect.poll(async () => (await posts('editMessageText')).length).toBeGreaterThanOrEqual(1);
  const edits = (await posts('editMessageText')).length;
  await createMarketClient(await signedAs('driver', JAHONGIR)).cancelTrip(trip.id);
  await expect.poll(async () => (await posts('editMessageText')).length).toBeGreaterThan(edits);
});

test('P51. a saved driver: the new trip comes by the bot', async () => {
  const first = await publishTrip(JAHONGIR, CHILONZOR, SAMARQAND, 'door');
  await createComfortClient(await signedAs('passenger', NARGIZA)).save(first.driver.id);
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
