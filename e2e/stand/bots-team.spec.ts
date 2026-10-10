import { createTeamClient } from '@platform/api-client';
import { expect, test } from '../crash-guard';
import { showChat } from './bot-chat';
import { buttons, press, say, sayByPhoto, sayByVoice } from './bot-kit';
import { askRide, confirmedSeat, MINUTE, moveTrip, offerOn, tailOf, toldBy, wordsOf } from './g27-kit';
import { AZIZA, GAYRAT, KAMRON, LAZIZA, OWNER, SEVARA } from './people';
import { register } from './seed';
import { signedAs, type Person } from './stand-kit';
import { botMessages, runCron, standRows } from './stand-tools';

// Buttons and help in the bots (docs/80 S05, S06, docs/79 T60, T61): the stars of a ride by one tap,
// the offer opened by its button, a person writes to the team and gets the answer.
test.describe.configure({ mode: 'serial' });
const HOUR = 60 * MINUTE;
const told = async (bot: string, chat: number, words: string) =>
  (await botMessages()).find((m) => m.bot === bot && m.chatId === chat && m.text.includes(words));
// The one team member the question of this person went to today, and the other one (docs/92).
const assigned = (person: Person) => {
  const [row] = standRows(
    `SELECT assignee_id FROM assignments WHERE kind = 'support' AND subject_id = ${person.id}`,
  );
  const member = Number(row?.['assignee_id']) === KAMRON.id ? KAMRON : OWNER;
  return { member, other: member === OWNER ? KAMRON : OWNER };
};
const copyOf = (person: Person, member: Person) =>
  standRows(
    `SELECT team_message_id FROM support_links WHERE person_chat_id = ${person.id} AND team_chat_id = ${member.id} ORDER BY created_at DESC LIMIT 1`,
  )[0]?.['team_message_id'];

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
  await toldBy('passenger', AZIZA, wordsOf('bot.ring.offer'));
  const message = await told('passenger', AZIZA.id, wordsOf('bot.ring.offer'));
  expect(message?.buttons[0]?.url).toContain(offer.id);
});

test('T60, T61. a person writes to the support bot, the team answers by a reply (G30)', async () => {
  expect((await say('support', AZIZA, '/start')).caption).toContain(wordsOf('bot.support.welcome'));
  const received = await say('support', AZIZA, 'Salom, safar topa olmayapman');
  expect(received.text).toBe(wordsOf('bot.support.received'));
  const { member, other } = assigned(AZIZA);
  await expect.poll(() => told('admin', member.id, 'safar topa olmayapman')).toBeTruthy();
  expect(await told('admin', other.id, 'safar topa olmayapman')).toBeUndefined();
  await say('admin', member, 'Ertaga yangi safarlar boʻladi', Number(copyOf(AZIZA, member)));
  await expect.poll(() => told('support', AZIZA.id, 'Ertaga yangi safarlar')).toBeTruthy();
});

test('the admin bot sends a person outside the team to the support bot (G30)', async () => {
  expect(buttons(await say('admin', AZIZA, '/start'))).toEqual([wordsOf('bot.admin.toSupport')]);
  const sent = await say('admin', AZIZA, 'Yordam kerak');
  expect(buttons(sent)).toEqual([wordsOf('bot.admin.toSupport')]);
  await expect.poll(() => told('admin', OWNER.id, 'Yordam kerak')).toBeUndefined();
});

test('a voice to the support bot and the voice answer of the team (G30)', async () => {
  expect((await sayByVoice('support', AZIZA)).text).toBe(wordsOf('bot.support.received'));
  const voiceTo = async (bot: string, chat: number) =>
    (await botMessages()).find((m) => m.bot === bot && m.chatId === chat && m.method === 'sendVoice');
  // The same person on the same day stays with the same member (docs/92).
  const { member } = assigned(AZIZA);
  await expect.poll(() => voiceTo('admin', member.id)).toBeTruthy();
  expect((await voiceTo('admin', member.id))?.text).toContain(wordsOf('bot.support.voice'));
  expect((await sayByVoice('admin', member, Number(copyOf(AZIZA, member)))).text).toBe(
    wordsOf('bot.support.sent'),
  );
  await expect.poll(() => voiceTo('support', AZIZA.id)).toBeTruthy();
});

test('G31, G75. «Jamoa» makes a moderator; the new questions go to whom has less work today', async () => {
  // Kamron is a person of Rida first: the test does not wait for another file to register him.
  await register('passenger', KAMRON, 'male');
  const [kamron] = standRows(`SELECT public_id FROM users WHERE id = ${KAMRON.id}`);
  await createTeamClient(await signedAs('admin', OWNER)).add(String(kamron?.public_id));
  // The owner already has the applications of the stand today; the new moderator has none (docs/92).
  await say('support', SEVARA, 'Bronim haqida savol');
  await say('support', GAYRAT, 'Hamyon haqida savol');
  expect([assigned(SEVARA).member, assigned(GAYRAT).member]).toEqual([KAMRON, KAMRON]);
  await expect.poll(() => told('admin', KAMRON.id, 'Hamyon haqida savol')).toBeTruthy();
  expect(await told('admin', OWNER.id, 'Hamyon haqida savol')).toBeUndefined();
});

test('G32. a photo in support; the next question comes with «Tarix» of the whole talk', async ({ page }) => {
  await sayByPhoto('support', LAZIZA, 'Chek shu');
  const { member } = assigned(LAZIZA);
  const photoTo = async () =>
    (await botMessages()).find(
      (m) =>
        m.bot === 'admin' &&
        m.chatId === member.id &&
        m.method === 'sendPhoto' &&
        // A new face of a registered person goes to the team as a photo too (G58).
        m.text.includes(wordsOf('bot.support.photo')),
    );
  await expect.poll(photoTo).toBeTruthy();
  expect((await photoTo())?.text).toContain(wordsOf('bot.support.photo'));
  await say('support', LAZIZA, 'Pulim hali kelmadi');
  await expect.poll(() => told('admin', member.id, 'Pulim hali kelmadi')).toBeTruthy();
  const copy = await told('admin', member.id, 'Pulim hali kelmadi');
  // The card of a question (G68, mockup g68/4): who writes and the text, never the Telegram ID.
  expect(copy?.text).toContain(wordsOf('bot.supportCard.title'));
  expect(copy?.text).not.toContain(String(LAZIZA.id));
  expect(copy?.buttons.map((b) => b.text)).toEqual([
    wordsOf('bot.supportCard.reply'),
    wordsOf('bot.supportCard.history'),
  ]);
  await press('admin', member, 'support:history', Number(copyOf(LAZIZA, member)));
  // The card quotes the words of the photo too (G68): «Tarix» is the message with its title.
  const title = `${LAZIZA.name}${tailOf('bot.support.historyTitle')}`;
  await expect.poll(() => told('admin', member.id, title)).toBeTruthy();
  const talk = (await told('admin', member.id, title))?.text;
  expect(talk).toContain('Chek shu');
  expect(talk).not.toContain(String(LAZIZA.id));
  // The chat of the team member as it looks, next to the mockup g68/4 for the owner.
  await showChat(
    page,
    'admin',
    (await botMessages()).filter((m) => m.bot === 'admin' && m.chatId === member.id),
  );
  await page.screenshot({ path: 'screenshots/stand/g68/8-admin-support.png', fullPage: true });
});
