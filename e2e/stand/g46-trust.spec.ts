import { createBookingsClient, createChatClient, createFeedbackClient } from '@platform/api-client';
import { expect, test } from '../crash-guard';
import { press, say } from './bot-kit';
import { askRide, confirmedSeat, MINUTE, moveTrip, outcome, toldBy, TO_SAMARQAND, wordsOf } from './g27-kit';
import { answer, book, cancelMine } from './market-kit';
import { approvedDriver, register } from './seed';
import { signedAs, type Person } from './stand-kit';
import { blockBots, botMessages, refusedMessages, runCron, standRows, standSql } from './stand-tools';

// G46 (docs/111) on the whole local Rida: the trust between people and the bots that never shout into
// the void (docs/77 P64, P77 … P79, docs/80 S07, docs/83 N07).
test.describe.configure({ mode: 'serial' });
const HOUR = 60 * MINUTE;
const ZAFAR: Person = { id: 900461, name: 'Zafar', phone: '998901110461' };
const NIGORA: Person = { id: 900462, name: 'Nigora', phone: '998901110462' };
const BAHROM: Person = { id: 900463, name: 'Bahrom', phone: '998901110463' };
const LOLA: Person = { id: 900464, name: 'Lola', phone: '998901110464' };
const KAMOLA: Person = { id: 900465, name: 'Kamola', phone: '998901110465' };
const ODIL: Person = { id: 900466, name: 'Odil', phone: '998901110466' };
const SEVARA: Person = { id: 900467, name: 'Sevara', phone: '998901110467' };
const CLOSE: Person = { id: 900468, name: 'Yaqin', phone: '998901110468' };
const chatOf = async (who: Person) => createChatClient(await signedAs('passenger', who));
const marks = (who: Person) => standRows(`SELECT bot FROM bot_blocks WHERE chat_id = ${who.id}`).length;

test('S07, N07. a person who blocked the bot is marked once; the bot is quiet until /start', async () => {
  await approvedDriver(ZAFAR, '01T461ZF');
  await register('passenger', NIGORA, 'female');
  await blockBots(NIGORA.id);
  const before = await refusedMessages();
  const { seat } = await confirmedSeat(ZAFAR, NIGORA);
  await expect.poll(refusedMessages).toBeGreaterThan(before);
  await expect.poll(() => marks(NIGORA)).toBe(1);
  const refused = await refusedMessages();
  const toDriver = (await botMessages()).filter((m) => m.chatId === ZAFAR.id).length;
  await cancelMine(NIGORA, seat.id);
  // The driver hears the cancel; nothing more is even tried to her.
  await expect
    .poll(async () => (await botMessages()).filter((m) => m.chatId === ZAFAR.id).length)
    .toBeGreaterThan(toDriver);
  expect(await refusedMessages()).toBe(refused);
  await say('passenger', NIGORA, '/start');
  expect(marks(NIGORA)).toBe(0);
});

test('P64. a request burned by its day rings with the search of the same route', async () => {
  await register('passenger', BAHROM, 'male');
  const request = await askRide(BAHROM);
  standSql(`UPDATE ride_requests SET expires_at = ${Date.now() - MINUTE} WHERE id = '${request.id}'`);
  await runCron();
  await toldBy('passenger', BAHROM, wordsOf('bot.ring.requestExpired'));
  const ring = (await botMessages()).find((m) => m.chatId === BAHROM.id && m.text.startsWith('⌛'));
  expect(ring?.buttons.some((button) => button.url?.includes('?find=') === true)).toBe(true);
});

test('P77. «Yetib keldingizmi?» an hour after the arrival; «Ha» marks it and closes the link', async () => {
  await approvedDriver(LOLA, '01T464LL');
  await register('passenger', KAMOLA, 'female');
  const { trip, seat } = await confirmedSeat(LOLA, KAMOLA);
  const token = (await (await chatOf(KAMOLA)).share(seat.id)).link.slice(-43);
  await register('passenger', CLOSE, 'female');
  expect(await outcome((await chatOf(CLOSE)).sharedTrip(token))).toBe('ok');
  // The trip left long ago: it ends in less than an hour, so an hour after its arrival is now.
  moveTrip(trip.id, Date.now() - 6 * HOUR, Date.now() + HOUR - 5 * MINUTE);
  await runCron();
  await toldBy('passenger', KAMOLA, wordsOf('bot.ring.arrivedAsk'));
  await press('passenger', KAMOLA, `arrived:${seat.id}:yes`);
  expect(
    standRows(`SELECT arrived_at FROM bookings WHERE id = '${seat.id}'`)[0]?.['arrived_at'],
  ).not.toBeNull();
  expect(await outcome((await chatOf(CLOSE)).sharedTrip(token))).toBe('shares.not_found');
});

test('P78, P79. passengers of one trip see each other; one complains about the other (Q4)', async () => {
  await approvedDriver(ODIL, '01T466OD');
  await register('passenger', SEVARA, 'female');
  await register('passenger', CLOSE, 'female');
  const { trip, seat } = await confirmedSeat(ODIL, SEVARA);
  const second = await book(CLOSE, trip, { seats: 1, mode: 'door', ...TO_SAMARQAND });
  await answer(ODIL, second.id, 'confirm');
  const riders = await createBookingsClient(await signedAs('passenger', SEVARA)).riders(seat.id);
  expect(riders.map((rider) => rider.firstName)).toEqual([CLOSE.name]);
  const [companion] = riders;
  await createFeedbackClient(await signedAs('passenger', SEVARA)).complain({
    bookingId: seat.id,
    reasons: ['other'],
    comment: '',
    about: companion?.id ?? '',
  });
  const [filed] = standRows(`SELECT against_id FROM complaints WHERE booking_id = '${seat.id}'`);
  expect(filed?.['against_id']).toBe(CLOSE.id);
});
