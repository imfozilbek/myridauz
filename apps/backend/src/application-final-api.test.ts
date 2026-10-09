import { applicationDetailSchema, adminApplicationPath, adminDecisionPath } from '@platform/contracts';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { fakeTelegram } from './bots/test-bot';
import { call, pid, registerUser } from './test-api';

const telegram = fakeTelegram();
vi.stubGlobal('fetch', telegram.fetch);
afterAll(() => vi.unstubAllGlobals());

const OWNER = 900;
const CHANGER = 46;
const REJECTED = 47;
const jpeg = { body: new Uint8Array(20), headers: { 'content-type': 'image/jpeg' } };
const nexia = { make: 'Chevrolet', model: 'Nexia', color: 'white', plate: '30 B 456 CA', seats: 4 };
const cobalt = { make: 'Chevrolet', model: 'Cobalt', color: 'black', plate: '30 C 789 DA', seats: 4 };
const json = (body: unknown) => ({
  body: JSON.stringify(body),
  headers: { 'content-type': 'application/json' },
});
const photo = (id: number, kind: string) =>
  call(`/driver/application/photos/${kind}`, id, { method: 'PUT', app: 'driver', ...jpeg });
const submit = (id: number, car: object) =>
  call('/driver/application', id, { method: 'POST', app: 'driver', ...json(car) });
const decide = async (id: number, decision: object) =>
  call(adminDecisionPath(await pid(id)), OWNER, { method: 'POST', app: 'admin', ...json(decision) });

async function apply(id: number, car: object) {
  await registerUser(id);
  await call('/me/avatar', id, { method: 'PUT', ...jpeg });
  for (const kind of ['front', 'side', 'interior']) await photo(id, kind);
  return submit(id, car);
}

// The decisions of the team on an application (G75, gap К of docs/158, docs/120): «Tuzatish» asks for
// a fix, «Rad etish» is the last word; a new car shows the one it replaces.
describe('the decisions on a driver application', () => {
  it('shows the team the approved car next to the new one', async () => {
    await registerUser(OWNER);
    expect((await apply(CHANGER, nexia)).status).toBe(200);
    expect((await decide(CHANGER, { action: 'approve' })).status).toBe(200);
    await photo(CHANGER, 'front');
    expect((await submit(CHANGER, cobalt)).status).toBe(200);
    const opened = await call(adminApplicationPath(await pid(CHANGER)), OWNER, { app: 'admin' });
    const detail = applicationDetailSchema.parse(await opened.json());
    expect(detail.car).toMatchObject({ model: 'Cobalt', plate: '30C789DA' });
    expect(detail.was).toMatchObject({ model: 'Nexia', plate: '30B456CA', color: 'white' });
  });

  it('keeps a rejected application closed: no new photo and no new sending', async () => {
    expect((await apply(REJECTED, nexia)).status).toBe(200);
    expect((await decide(REJECTED, { action: 'reject', reasons: ['fake_profile'] })).status).toBe(200);
    expect((await photo(REJECTED, 'front')).status).toBe(409);
    const again = await submit(REJECTED, nexia);
    expect([again.status, await again.json()]).toEqual([409, { error: 'drivers.wrong_status' }]);
  });
});
