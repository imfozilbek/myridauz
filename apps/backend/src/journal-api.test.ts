import { ADMIN_JOURNAL_PATH, ADMIN_WORK_PATH, journalSchema, workSchema } from '@platform/contracts';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { fakeTelegram } from './bots/test-bot';
import { changeModerator } from './modules/team';
import { call, pid, registerUser, testEnv } from './test-api';

const telegram = fakeTelegram();
vi.stubGlobal('fetch', telegram.fetch);
// 2026-10-05 10:00 in Tashkent: team hours.
const MORNING = Date.parse('2026-10-05T05:00:00Z');
const MINUTE = 60 * 1000;
vi.useFakeTimers({ toFake: ['Date'] });
vi.setSystemTime(MORNING);
afterAll(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const APPLICANT = 45;
const OWNER = 900;
const MODERATOR = 952;
const jpeg = { body: new Uint8Array(20), headers: { 'content-type': 'image/jpeg' } };
const car = { make: 'Chevrolet', model: 'Nexia', color: 'white', plate: '30 B 456 CA', seats: 4 };
const json = (method: string, body: unknown) => ({
  app: 'admin',
  method,
  body: JSON.stringify(body),
  headers: { 'content-type': 'application/json' },
});

async function apply(id: number) {
  await registerUser(id);
  await call('/me/avatar', id, { method: 'PUT', ...jpeg });
  for (const kind of ['front', 'side', 'interior'])
    await call(`/driver/application/photos/${kind}`, id, { method: 'PUT', app: 'driver', ...jpeg });
  const headers = { 'content-type': 'application/json' };
  return call('/driver/application', id, {
    method: 'POST',
    app: 'driver',
    body: JSON.stringify(car),
    headers,
  });
}

// The journal of the team (G75, gap К of docs/158): every decision of a member in one list for the
// owner, and the numbers of the own day for each member (mockup g67/1).
describe('the journal of the team', () => {
  it('writes a decision with its wait, and gives the member the numbers of the day', async () => {
    await registerUser(MODERATOR);
    await changeModerator(testEnv, OWNER, MODERATOR, true);
    expect((await apply(APPLICANT)).status).toBe(200);
    vi.setSystemTime(MORNING + 40 * MINUTE);
    const decided = await call(
      `/admin/applications/${await pid(APPLICANT)}/decision`,
      MODERATOR,
      json('POST', { action: 'approve' }),
    );
    expect(decided.status).toBe(200);
    const work = workSchema.parse(await (await call(ADMIN_WORK_PATH, MODERATOR, { app: 'admin' })).json());
    expect(work).toMatchObject({ done: 1, averageMinutes: 40, over: 1 });
  });

  it('gives the owner the newest first, with who did it; a moderator has no journal', async () => {
    const journal = journalSchema.parse(
      await (await call(ADMIN_JOURNAL_PATH, OWNER, { app: 'admin' })).json(),
    );
    expect(journal.entries.slice(0, 2)).toEqual([
      {
        member: 'Ali',
        kind: 'application',
        subject: await pid(APPLICANT),
        action: 'approve',
        at: MORNING + 40 * MINUTE,
      },
      { member: '', kind: 'team', subject: await pid(MODERATOR), action: 'add', at: MORNING },
    ]);
    const refused = await call(ADMIN_JOURNAL_PATH, MODERATOR, { app: 'admin' });
    expect([refused.status, await refused.json()]).toEqual([403, { error: 'auth.not_owner' }]);
  });
});
