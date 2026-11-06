import {
  ADMIN_MY_DECISIONS_PATH,
  ADMIN_TEAM_PATH,
  ADMIN_WORK_PATH,
  adminApplicationPath,
  adminCarFixPath,
  adminDecisionPath,
  adminReopenPath,
  applicationDetailSchema,
  CAR_PHOTO_KINDS,
  myDecisionsSchema,
  workSchema,
} from '@platform/contracts';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { fakeTelegram } from './bots/test-bot';
import { call, pid, registerUser } from './test-api';

const telegram = fakeTelegram();
vi.stubGlobal('fetch', telegram.fetch);
afterAll(() => vi.unstubAllGlobals());

const OWNER = 900;
const AZIZ = 71;
const FARHOD = 72;
const BOBUR = 73;
const SARDOR = 74;
const jpeg = { body: new Uint8Array(20), headers: { 'content-type': 'image/jpeg' } };
const cobalt = { make: 'Chevrolet', model: 'Cobalt', color: 'white', plate: '01 A 123 BC', seats: 4 };
const json = (body: unknown) => ({
  body: JSON.stringify(body),
  headers: { 'content-type': 'application/json' },
});
const admin = (path: string, id: number, body?: unknown) =>
  call(path, id, body === undefined ? { app: 'admin' } : { method: 'POST', app: 'admin', ...json(body) });

async function apply(id: number) {
  await registerUser(id);
  await call('/me/avatar', id, { method: 'PUT', ...jpeg });
  for (const kind of CAR_PHOTO_KINDS)
    await call(`/driver/application/photos/${kind}`, id, { method: 'PUT', app: 'driver', ...jpeg });
  return call('/driver/application', id, { method: 'POST', app: 'driver', ...json(cobalt) });
}

// G95 (docs/224): a moderator finds the decision in «Mening qarorlarim» and fixes it; a refusal goes
// back to «Navbat» by the owner only.
describe('the team fixes its own decisions', () => {
  it('lets a moderator fix the car he approved by its photo', async () => {
    await registerUser(OWNER);
    await registerUser(AZIZ);
    expect((await admin(ADMIN_TEAM_PATH, OWNER, { person: await pid(AZIZ) })).status).toBe(204);
    expect((await apply(FARHOD)).status).toBe(200);
    const farhod = await pid(FARHOD);
    expect((await admin(adminDecisionPath(farhod), AZIZ, { action: 'approve' })).status).toBe(200);
    const mine = myDecisionsSchema.parse(await (await admin(ADMIN_MY_DECISIONS_PATH, AZIZ)).json());
    expect(mine.decisions).toMatchObject([{ userId: farhod, status: 'approved', plate: '01A123BC' }]);
    const fixed = await admin(adminCarFixPath(farhod), AZIZ, { ...cobalt, plate: '01A777BC' });
    expect(fixed.status).toBe(200);
    const detail = applicationDetailSchema.parse(
      await (await admin(adminApplicationPath(farhod), AZIZ)).json(),
    );
    expect([detail.status, detail.car.plate]).toEqual(['approved', '01A777BC']);
    const plate = await admin(adminCarFixPath(farhod), AZIZ, { ...cobalt, plate: 'abc' });
    expect([plate.status, await plate.json()]).toEqual([400, { error: 'drivers.invalid_input' }]);
  });

  it('sends a refusal back to «Navbat» by the owner, never by a moderator', async () => {
    expect((await apply(BOBUR)).status).toBe(200);
    const bobur = await pid(BOBUR);
    const reasons = ['plate_not_readable'];
    expect((await admin(adminDecisionPath(bobur), AZIZ, { action: 'reject', reasons })).status).toBe(200);
    const moderator = await admin(adminReopenPath(bobur), AZIZ, {});
    expect([moderator.status, await moderator.json()]).toEqual([403, { error: 'auth.not_owner' }]);
    expect((await admin(adminReopenPath(bobur), OWNER, {})).status).toBe(204);
    const detail = applicationDetailSchema.parse(
      await (await admin(adminApplicationPath(bobur), OWNER)).json(),
    );
    expect(detail.status).toBe('pending');
    const again = await admin(adminReopenPath(bobur), OWNER, {});
    expect([again.status, await again.json()]).toEqual([409, { error: 'drivers.wrong_status' }]);
  });

  // «Tuzatishga qaytarish» of an approved application waited for nobody: the numbers of the day never
  // count it as a late case.
  it('never counts sending an approved application back as a case that waited', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.parse('2026-11-06T05:00:00Z'));
    expect((await apply(SARDOR)).status).toBe(200);
    const sardor = await pid(SARDOR);
    expect((await admin(adminDecisionPath(sardor), AZIZ, { action: 'approve' })).status).toBe(200);
    vi.setSystemTime(Date.parse('2026-11-06T08:00:00Z'));
    const back = { action: 'request_changes', reasons: ['plate_not_readable'] };
    expect((await admin(adminDecisionPath(sardor), AZIZ, back)).status).toBe(200);
    const work = workSchema.parse(await (await admin(ADMIN_WORK_PATH, AZIZ)).json());
    expect(work.over).toBe(0);
    vi.useRealTimers();
  });
});
