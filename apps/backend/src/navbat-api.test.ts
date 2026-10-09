import { ADMIN_NAVBAT_PATH, navbatSchema, navbatTakePath } from '@platform/contracts';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { fakeTelegram } from './bots/test-bot';
import { assignTo } from './modules/assignments';
import { changeModerator } from './modules/team';
import { call, pid, registerUser, testEnv } from './test-api';

const telegram = fakeTelegram();
vi.stubGlobal('fetch', telegram.fetch);
// 2026-10-02 10:00 in Tashkent: team hours.
const MORNING = Date.parse('2026-10-02T05:00:00Z');
const MINUTE = 60 * 1000;
vi.useFakeTimers({ toFake: ['Date'] });
vi.setSystemTime(MORNING);
afterAll(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const APPLICANT = 43;
const STRANGER = 44;
const OWNER = 900;
const MODERATOR = 951;
const jpeg = { body: new Uint8Array(20), headers: { 'content-type': 'image/jpeg' } };
const car = { make: 'Chevrolet', model: 'Cobalt', color: 'white', plate: '01 A 123 BC', seats: 4 };
const team = { app: 'admin' };
const navbat = async (id: number) =>
  navbatSchema.parse(await (await call(ADMIN_NAVBAT_PATH, id, team)).json());

async function apply(id: number) {
  await registerUser(id);
  await call('/me/avatar', id, { method: 'PUT', ...jpeg });
  for (const kind of ['front', 'side', 'interior'])
    await call(`/driver/application/photos/${kind}`, id, { method: 'PUT', app: 'driver', ...jpeg });
  const body = JSON.stringify(car);
  return call('/driver/application', id, {
    method: 'POST',
    app: 'driver',
    body,
    headers: { 'content-type': 'application/json' },
  });
}

// «Navbat» of the admin app (G75, docs/120): the cases of the bot card in one list, the oldest
// first, red over 30 minutes of team time, and who of the team has opened a case.
describe('«Navbat» in the admin app', () => {
  it('lists the application with its car, counts it, and turns it late after 30 team minutes', async () => {
    await registerUser(MODERATOR);
    await changeModerator(testEnv, OWNER, MODERATOR, true);
    expect((await apply(APPLICANT)).status).toBe(200);
    vi.setSystemTime(MORNING + 12 * MINUTE);
    const fresh = await navbat(MODERATOR);
    const application = fresh.items.find((item) => item.kind === 'application');
    expect(application).toMatchObject({
      id: await pid(APPLICANT),
      car: { make: 'Chevrolet', model: 'Cobalt', plate: '01A123BC' },
      minutes: 12,
      late: false,
      takenBy: null,
    });
    expect(fresh.counts.application).toBe(1);
    vi.setSystemTime(MORNING + 31 * MINUTE);
    expect((await navbat(MODERATOR)).items.find((item) => item.kind === 'application')).toMatchObject({
      minutes: 31,
      late: true,
    });
  });

  it('shows the others who opened a case, for 10 minutes', async () => {
    const id = await pid(APPLICANT);
    expect(
      (await call(navbatTakePath('application', id), MODERATOR, { ...team, method: 'POST' })).status,
    ).toBe(204);
    const taken = (await navbat(OWNER)).items.find((item) => item.kind === 'application');
    expect(taken?.takenBy).toBe('Ali');
    expect((await navbat(MODERATOR)).items.find((item) => item.kind === 'application')?.takenBy).toBeNull();
    vi.setSystemTime(MORNING + 42 * MINUTE);
    expect((await navbat(OWNER)).items.find((item) => item.kind === 'application')?.takenBy).toBeNull();
  });

  it('lists a support question not answered yet, by the public id of the person (G75)', async () => {
    await registerUser(STRANGER);
    await assignTo(testEnv, 'support', STRANGER);
    const asked = (await navbat(OWNER)).items.find((item) => item.kind === 'support');
    expect(asked).toMatchObject({ id: await pid(STRANGER), name: 'Ali' });
  });

  it("is the team's only", async () => {
    await registerUser(STRANGER);
    expect((await call(ADMIN_NAVBAT_PATH, STRANGER, team)).status).toBe(403);
  });
});
