import {
  createModerationClient,
  createPitaksClient,
  createPricingClient,
  createStatsClient,
  createTeamClient,
  createUsersClient,
} from '@platform/api-client';
import { expect, test } from '../crash-guard';
import { outcome, SAMARQAND } from './g27-kit';
import { CHILONZOR } from './market-kit';
import { KAMRON, OWNER } from './people';
import { apply, register } from './seed';
import { signedAs, type Person } from './stand-kit';
import { botMessages, runCron, standRows, standSql } from './stand-tools';

// G45 (docs/79 T27, T45, T48, T62, T63, docs/111) on the whole local Rida: the tools of the team
// through the same API the admin Mini App calls.
test.describe.configure({ mode: 'serial' });
const LAZIZ: Person = { id: 900451, name: 'Laziz', phone: '998901110451' };
const SHOIRA: Person = { id: 900452, name: 'Shoira', phone: '998901110452' };
const admin = (person: Person) => signedAs('admin', person);
// Who changed a thing, as the team reads it: the first name of the account, never the Telegram ID.
const nameOf = (person: Person) =>
  String(standRows(`SELECT first_name FROM users WHERE id = ${person.id}`)[0]?.['first_name'] ?? '');
const publicIdOf = async (person: Person) => {
  const me = await createUsersClient(await signedAs('passenger', person)).getMe();
  return me.state === 'active' ? me.profile.id : '';
};

test.beforeAll(() =>
  standSql(
    `INSERT OR IGNORE INTO team_members (user_id, role, added_by, added_at) ` +
      `VALUES (${KAMRON.id}, 'moderator', ${OWNER.id}, ${Date.now()})`,
  ),
);

test('T27. a moderator blocks right from a driver application: the same block', async () => {
  await apply(LAZIZ, '01T451UV', 'male');
  const moderation = createModerationClient(await admin(KAMRON));
  const application = (await moderation.queue()).find((one) => one.car.plate === '01T451UV');
  expect(application).toBeTruthy();
  await moderation.block(application?.userId ?? '', 7);
  const journal = await createModerationClient(await admin(OWNER)).blocks(application?.userId ?? '');
  expect(journal.active?.until).toEqual(expect.any(Number));
});

test('T45. a pitak keeps who changed it by the name, never the Telegram ID', async () => {
  const pitaks = createPitaksClient(await admin(OWNER));
  const input = { name: 'G45 pitak', point: { lat: 41.2856, lng: 69.2034 }, status: 'candidate' as const };
  const pitak = await pitaks.add(input);
  await pitaks.change(pitak.id, { ...input, name: 'G45 pitak 2' });
  const changes = (await pitaks.history()).filter((change) => change.subject === `pitak:${pitak.id}`);
  expect(changes.length).toBeGreaterThan(0);
  expect(changes.every((change) => change.by === nameOf(OWNER))).toBe(true);
  expect(changes.some((change) => change.by.includes(String(OWNER.id)))).toBe(false);
});

test('G45. the owner corrects a distance; who, when, before and after stay', async () => {
  const pricing = createPricingClient(await admin(OWNER));
  const moderator = createPricingClient(await admin(KAMRON));
  const [direction] = (await pricing.directions()).filter((one) => one.km !== null);
  const { from, to, km } = direction ?? { from: CHILONZOR, to: SAMARQAND, km: 300 };
  expect(await outcome(moderator.setDistance({ from, to, km: (km ?? 300) + 1 }))).toBe('auth.not_owner');
  await pricing.setDistance({ from, to, km: (km ?? 300) + 1 });
  await pricing.setDistance({ from, to, km: km ?? 300 });
  const [last] = (await moderator.distanceHistory(from, to)).changes;
  expect(last).toMatchObject({ before: (km ?? 300) + 1, after: km ?? 300, by: nameOf(OWNER) });
});

// The signal itself needs the SQL of Analytics Engine, which the stand has not: its words and rules are
// unit tests (stats.test.ts). Here the Cron job of the signals runs on the whole Rida and sends nothing
// false, and «Statistika» says the events are off.
test('T48. the Cron of the signals runs without the analytics key and sends no false signal', async () => {
  await runCron();
  expect((await createStatsClient(await admin(OWNER)).get('day')).events).toBe('off');
  const signals = (await botMessages()).filter(
    (message) => message.chatId === OWNER.id && message.text.startsWith('⚠️ Xatolar'),
  );
  expect(signals).toEqual([]);
});

test('T62, T63. only the owner makes a moderator and takes one away', async () => {
  await register('passenger', SHOIRA, 'female');
  const id = await publicIdOf(SHOIRA);
  const moderator = createTeamClient(await admin(KAMRON));
  const owner = createTeamClient(await admin(OWNER));
  expect(await outcome(moderator.add(id))).toBe('auth.not_owner');
  await owner.add(id);
  expect((await owner.members()).members.some((member) => member.id === id)).toBe(true);
  expect(await outcome(moderator.remove(id))).toBe('auth.not_owner');
  await owner.remove(id);
  expect((await owner.members()).members.some((member) => member.id === id)).toBe(false);
});
