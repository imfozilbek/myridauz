import { expect, test } from '../crash-guard';
import { createFeedbackClient, createMarketClient } from '@platform/api-client';
import { tashkentDate } from '@platform/contracts';
import { CHILONZOR, publishTrip } from './market-kit';
import { confirmedSeat, MINUTE, SAMARQAND, toldBy, wordsOf } from './g27-kit';
import { KOMIL, OWNER, SEVARA } from './people';
import { signedAs } from './stand-kit';
import { botMessages, clearBotMessages, standSql } from './stand-tools';

// An urgent complaint and its chat (docs/79 T20, T22), the buttons of a channel post (docs/80 S63,
// S64) and a trip near midnight in Tashkent (docs/81 V01).
test.describe.configure({ mode: 'serial' });
const HOUR = 60 * MINUTE;

test('T20, T22. a fake profile is urgent: the team hears at once and may read the chat', async () => {
  const { seat } = await confirmedSeat(KOMIL, SEVARA);
  await (
    await createFeedbackClient(await signedAs('passenger', SEVARA))
  ).complain({
    bookingId: seat.id,
    reason: 'fake_profile',
  });
  await toldBy('admin', OWNER, wordsOf('bot.complaint.urgent'));
  const team = createFeedbackClient(await signedAs('admin', OWNER));
  const complaint = (await team.queue()).find((c) => c.tripId === seat.trip.id);
  expect(complaint?.high).toBe(true);
  expect(await team.chat(complaint?.id ?? '')).toEqual(expect.any(Array));
});

test('S63, S64. a channel post books this trip and subscribes to its route', async () => {
  await clearBotMessages();
  const trip = await publishTrip(KOMIL, CHILONZOR, SAMARQAND, 'door');
  const post = async () =>
    (await botMessages()).find((m) => m.chat.startsWith('@') && m.method === 'sendMessage');
  await expect.poll(post).toBeTruthy();
  const urls = (await post())?.buttons.map((b) => b.url ?? '') ?? [];
  expect(urls.some((url) => url.includes(`trip_${trip.id}`))).toBe(true);
  expect(urls.length).toBeGreaterThanOrEqual(2);
});

test('V01. a trip at 23:50 in Tashkent is found on its Tashkent day, not the next one', async () => {
  const trip = await publishTrip(KOMIL, CHILONZOR, SAMARQAND, 'door');
  const day = tashkentDate(Date.now() + 2 * 24 * HOUR);
  // 23:50 in Tashkent is 18:50 UTC of the same day.
  const lateEvening = Date.parse(`${day}T18:50:00Z`);
  standSql(`UPDATE trips SET depart_at = ${lateEvening} WHERE id = '${trip.id}'`);
  const market = createMarketClient(await signedAs('passenger', SEVARA));
  const on = async (date: string) =>
    (await market.searchTrips({ from: CHILONZOR, to: SAMARQAND, date })).some((t) => t.id === trip.id);
  expect(await on(day)).toBe(true);
  expect(await on(tashkentDate(lateEvening + 24 * HOUR))).toBe(false);
});
