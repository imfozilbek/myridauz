import { createTeamClient } from '@platform/api-client';
import { tashkentDate, tashkentTime } from '@platform/contracts';
import { expect, test } from '../crash-guard';
import { say } from './bot-kit';
import { MINUTE, tailOf, wordsOf } from './g27-kit';
import { KAMRON, OWNER } from './people';
import { apply, register } from './seed';
import { signedAs, type Person } from './stand-kit';
import { botMessages, clearBotMessages, runCron, standRows, standSql } from './stand-tools';

// What the Cron does for the team (G49, docs/80 S76 … S78): a driver application nobody opened
// reminds its moderator, then the owners; the summary of the day reaches the owner at 21:00 once;
// the support talks older than 90 days are erased.
test.describe.configure({ mode: 'serial' });
const NAVRUZ: Person = { id: 900901, name: 'Navruz', phone: '998901110901' };
const SHOIRA: Person = { id: 900902, name: 'Shoira', phone: '998901110902' };
const DAY = 24 * 60 * MINUTE;
const SUMMARY_FROM = '21:00';
const TEAM = [OWNER.id, KAMRON.id];

const adminSaid = async (words: readonly string[]) =>
  (await botMessages()).filter(
    (m) => m.bot === 'admin' && TEAM.includes(m.chatId ?? 0) && words.every((w) => m.text.includes(w)),
  );
// The clock of the application moves back; the reminders already sent move with it (one sending).
const waitedFor = (person: Person, minutes: number) => {
  const at = Date.now() - minutes * MINUTE;
  standSql(`UPDATE application_reminders SET submitted_at = ${at} WHERE user_id = ${person.id};
    UPDATE driver_applications SET submitted_at = ${at} WHERE user_id = ${person.id}`);
};

test('S76. an application waits: its moderator at 25 minutes, the owners at 30, each once', async () => {
  await apply(NAVRUZ, '01N901NV', 'male');
  const late = [NAVRUZ.name, tailOf('bot.navbat.ringLate')];
  const owners = [wordsOf('bot.moderation.ownerWaiting'), NAVRUZ.name];
  await clearBotMessages();
  waitedFor(NAVRUZ, 26);
  await runCron();
  await expect.poll(async () => (await adminSaid(late)).length).toBe(1);
  expect(await adminSaid(owners)).toHaveLength(0);
  waitedFor(NAVRUZ, 31);
  await runCron();
  await expect.poll(async () => (await adminSaid(owners)).length).toBeGreaterThan(0);
  const sign = (await createTeamClient(await signedAs('admin', OWNER)).attention()).signs;
  expect(sign.some(({ sign: s }) => s.kind === 'late' && s.name === NAVRUZ.name)).toBe(true);
  // The next ticks ring no more for the same sending.
  const rung = (await adminSaid(owners)).length;
  await runCron();
  expect(await adminSaid(late)).toHaveLength(1);
  expect(await adminSaid(owners)).toHaveLength(rung);
});

test('S77. the summary of the day: to the owner after 21:00 in Tashkent, once a day', async () => {
  const today = tashkentDate(Date.now());
  standSql(`DELETE FROM team_digests WHERE day = '${today}'`);
  await clearBotMessages();
  await runCron();
  const summaries = async () =>
    (await botMessages()).filter((m) => m.bot === 'admin' && m.text.includes(wordsOf('bot.summary.title')));
  // The stand runs at the hour of the clock; pnpm stand:check --area channels --at 21:30 sees the evening.
  const evening = tashkentTime(Date.now()) >= SUMMARY_FROM;
  await expect.poll(async () => (await summaries()).map((m) => m.chatId)).toEqual(evening ? [OWNER.id] : []);
  await runCron();
  expect((await summaries()).length).toBe(evening ? 1 : 0);
  if (evening)
    expect((await summaries())[0]?.buttons.map((b) => b.text)).toEqual([wordsOf('bot.summary.open')]);
});

test('S78. the support talk is erased after 90 days, the fresh one stays', async () => {
  await register('passenger', SHOIRA, 'female');
  await say('support', SHOIRA, 'Eski savol');
  await say('support', SHOIRA, 'Yangi savol');
  const talk = () =>
    standRows(`SELECT text FROM support_messages WHERE person_id = ${SHOIRA.id} AND author = 'person'`).map(
      (row) => row['text'],
    );
  await expect.poll(talk).toEqual(['Eski savol', 'Yangi savol']);
  standSql(
    `UPDATE support_messages SET at = ${Date.now() - 91 * DAY} WHERE person_id = ${SHOIRA.id} AND text = 'Eski savol'`,
  );
  await runCron();
  expect(talk()).toEqual(['Yangi savol']);
});
