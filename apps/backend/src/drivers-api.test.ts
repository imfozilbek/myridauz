import { afterAll, describe, expect, it, vi } from 'vitest';
import { fakeTelegram } from './bots/test-bot';
import { changeModerator } from './modules/team';
import { call, pid, registerUser, testEnv } from './test-api';

// The bots are called for real in production: here a fake Telegram answers.
vi.stubGlobal('fetch', fakeTelegram().fetch);
afterAll(() => vi.unstubAllGlobals());

const APPLICANT = 5;
const STRANGER = 7;
const OWNER = 900;
const MODERATOR = 950;
const jpeg = { body: new Uint8Array(20), headers: { 'content-type': 'image/jpeg' } };
const json = (body: unknown) => ({
  body: JSON.stringify(body),
  headers: { 'content-type': 'application/json' },
});
const car = {
  make: 'Chevrolet',
  model: 'Cobalt',
  color: 'white',
  plate: '01 A 123 BC',
  seats: 4,
};

async function applyAsDriver(id: number) {
  await registerUser(id);
  await call('/me/avatar', id, { method: 'PUT', ...jpeg });
  for (const kind of ['front', 'side', 'interior']) {
    await call(`/driver/application/photos/${kind}`, id, { method: 'PUT', app: 'driver', ...jpeg });
  }
  return call('/driver/application', id, { method: 'POST', app: 'driver', ...json(car) });
}

describe('drivers API (docs/04)', () => {
  it('takes an application from the driver Mini App', async () => {
    const response = await applyAsDriver(APPLICANT);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      application: { status: 'pending', car: { plate: '01A123BC' } },
    });
    const bad = await call('/driver/application', APPLICANT, { method: 'POST', app: 'driver', ...json({}) });
    expect(bad.status).toBe(400);
    const wrongKind = await call('/driver/application/photos/roof', APPLICANT, { method: 'PUT', ...jpeg });
    expect(wrongKind.status).toBe(400);
  });

  it('shows applications and their photos only to the team', async () => {
    for (const path of ['/admin/applications', `/admin/applications/${await pid(APPLICANT)}/photos/front`]) {
      expect((await call(path, STRANGER, { app: 'passenger' })).status).toBe(403);
      expect((await call(path, OWNER, { app: 'admin' })).status).toBe(200);
    }
    // The own photo is seen through /driver: only one's own application, never another one.
    expect((await call('/driver/application/photos/front', STRANGER, { app: 'driver' })).status).toBe(404);
    expect((await call('/driver/application/photos/front', APPLICANT, { app: 'driver' })).status).toBe(200);
    const queue = (await (await call('/admin/applications', OWNER, { app: 'admin' })).json()) as {
      applications: { userId: string }[];
    };
    expect(queue.applications.map((item) => item.userId)).toContain(await pid(APPLICANT));
  });

  it('lets a moderator added by the owner decide, and makes the person a driver', async () => {
    expect(await changeModerator(testEnv, STRANGER, MODERATOR, true)).toBe('team.not_owner');
    expect(await changeModerator(testEnv, OWNER, MODERATOR, true)).toBe('ok');
    const decision = `/admin/applications/${await pid(APPLICANT)}/decision`;
    expect(
      (await call(decision, MODERATOR, { method: 'POST', app: 'admin', ...json({ action: 'x' }) })).status,
    ).toBe(400);
    const approved = await call(decision, MODERATOR, {
      method: 'POST',
      app: 'admin',
      ...json({ action: 'approve', plate: '01 a 777 bc' }),
    });
    expect(approved.status).toBe(200);
    // The plate fixed by the front photo is kept (docs/50).
    expect(((await approved.json()) as { car: { plate: string } }).car.plate).toBe('01A777BC');
    const me = (await (await call('/me', APPLICANT, { app: 'driver' })).json()) as {
      profile: { roles: string[] };
    };
    expect(me.profile.roles).toContain('driver');
    const again = await call(decision, MODERATOR, {
      method: 'POST',
      app: 'admin',
      ...json({ action: 'approve' }),
    });
    expect(again.status).toBe(409);
    expect(await changeModerator(testEnv, OWNER, MODERATOR, false)).toBe('ok');
    expect((await call('/admin/applications', MODERATOR, { app: 'admin' })).status).toBe(403);
  });

  it('lets the team block a person', async () => {
    const block = `/admin/users/${await pid(APPLICANT)}/block`;
    expect((await call(block, OWNER, { method: 'POST', app: 'admin', ...json({ days: 3 }) })).status).toBe(
      400,
    );
    expect((await call(block, OWNER, { method: 'POST', app: 'admin', ...json({ days: 7 }) })).status).toBe(
      204,
    );
    expect((await call('/driver/application', APPLICANT, { app: 'driver' })).status).toBe(403);
  });
});
