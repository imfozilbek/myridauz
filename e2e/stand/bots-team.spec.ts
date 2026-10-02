import { expect, test } from '@playwright/test';
import { buttons, press, say } from './bot-kit';
import { askRide, confirmedSeat, MINUTE, moveTrip, offerOn, toldBy, wordsOf } from './g27-kit';
import { AZIZA, GAYRAT, OWNER, SEVARA } from './people';
import { botMessages, runCron, standRows } from './stand-tools';

// Buttons and help in the bots (docs/80 S05, S06, docs/79 T60, T61): the stars of a ride by one tap,
// the offer opened by its button, a person writes to the team and gets the answer.
test.describe.configure({ mode: 'serial' });
const HOUR = 60 * MINUTE;
const told = async (bot: string, chat: number, words: string) =>
  (await botMessages()).find((m) => m.bot === bot && m.chatId === chat && m.text.includes(words));

test('S06. 2 stars by the button: thanks, a review and a complaint are offered', async () => {
  const { trip, seat } = await confirmedSeat(GAYRAT, SEVARA);
  moveTrip(trip.id, Date.now() - 10 * HOUR, Date.now() - MINUTE);
  await runCron();
  await toldBy('passenger', SEVARA, wordsOf('bot.rating.ask'));
  await press('passenger', SEVARA, `rate:${seat.id}:2`);
  await expect.poll(() => told('passenger', SEVARA.id, wordsOf('bot.rating.thanks'))).toBeTruthy();
  const thanks = await told('passenger', SEVARA.id, wordsOf('bot.rating.thanks'));
  expect(thanks?.buttons.map((b) => b.text)).toEqual([
    wordsOf('bot.rating.review'),
    wordsOf('bot.rating.complain'),
  ]);
});

test('S05. the offer comes with a button that opens this offer', async () => {
  const request = await askRide(AZIZA);
  const offer = await offerOn(GAYRAT, request.id);
  await toldBy('passenger', AZIZA, wordsOf('bot.offer.new'));
  const message = await told('passenger', AZIZA.id, wordsOf('bot.offer.new'));
  expect(message?.buttons[0]?.url).toContain(offer.id);
});

test('T60, T61. a person writes to the support bot, the team answers by a reply (G30)', async () => {
  expect((await say('support', AZIZA, '/start')).text).toContain(wordsOf('bot.support.welcome'));
  const received = await say('support', AZIZA, 'Salom, safar topa olmayapman');
  expect(received.text).toBe(wordsOf('bot.support.received'));
  await expect.poll(() => told('admin', OWNER.id, 'safar topa olmayapman')).toBeTruthy();
  const [link] = standRows(
    `SELECT team_message_id FROM support_links WHERE person_chat_id = ${AZIZA.id} AND bot = 'support'`,
  );
  await say('admin', OWNER, 'Ertaga yangi safarlar boʻladi', Number(link?.['team_message_id']));
  await expect.poll(() => told('support', AZIZA.id, 'Ertaga yangi safarlar')).toBeTruthy();
});

test('the admin bot sends a person outside the team to the support bot (G30)', async () => {
  expect(buttons(await say('admin', AZIZA, '/start'))).toEqual([wordsOf('bot.admin.toSupport')]);
  const sent = await say('admin', AZIZA, 'Yordam kerak');
  expect(buttons(sent)).toEqual([wordsOf('bot.admin.toSupport')]);
  await expect.poll(() => told('admin', OWNER.id, 'Yordam kerak')).toBeUndefined();
});
