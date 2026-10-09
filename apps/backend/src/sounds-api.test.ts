import { ADMIN_SOUNDS_PATH, PUBLIC_SOUNDS_PATH, type SoundsState } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { app } from './app';
import { changeModerator } from './modules/team';
import { call, testEnv } from './test-api';

const OWNER = 900;
const MODERATOR = 907;
const pick = (id: number, body: unknown) =>
  call(ADMIN_SOUNDS_PATH, id, {
    app: 'admin',
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
const played = async () => (await app.request(PUBLIC_SOUNDS_PATH, {}, testEnv)).json();

describe('the sounds of the brand (G54, docs/115)', () => {
  it('plays the default set of the brand until the owner picks; only the owner picks a set the brand has', async () => {
    const response = await app.request(PUBLIC_SOUNDS_PATH, {}, testEnv);
    expect(response.headers.get('cache-control')).toBe('public, max-age=60');
    expect(await response.json()).toEqual({ set: '3' });
    expect(await changeModerator(testEnv, OWNER, MODERATOR, true)).toBe('ok');
    // «Ovozlar» is in «Boshqaruv»: the owner's only, reading too (docs/120, G75).
    const hidden = await call(ADMIN_SOUNDS_PATH, MODERATOR, { app: 'admin' });
    expect([hidden.status, await hidden.json()]).toEqual([403, { error: 'auth.not_owner' }]);
    const seen = (await (await call(ADMIN_SOUNDS_PATH, OWNER, { app: 'admin' })).json()) as SoundsState;
    expect(seen).toEqual({
      set: '3',
      sets: ['1', '2', '3'],
      changedBy: null,
      changedAt: null,
      canEdit: true,
    });
    const refused = await pick(MODERATOR, { set: '1' });
    expect([refused.status, await refused.json()]).toEqual([403, { error: 'auth.not_owner' }]);
    expect((await call(ADMIN_SOUNDS_PATH, 5, { app: 'passenger' })).status).toBe(403);
    const unknown = await pick(OWNER, { set: '9' });
    expect([unknown.status, await unknown.json()]).toEqual([400, { error: 'sounds.unknown_set' }]);
    expect((await pick(OWNER, null)).status).toBe(400);
    const saved = (await (await pick(OWNER, { set: '1' })).json()) as SoundsState;
    expect(saved).toMatchObject({ set: '1', changedBy: OWNER, canEdit: true });
    expect(saved.changedAt).toEqual(expect.any(Number));
    expect(await played()).toEqual({ set: '1' });
  });
});
