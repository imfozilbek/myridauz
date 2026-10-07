import { afterAll, describe, expect, it, vi } from 'vitest';
import { app } from './app';
import { fakeTelegram } from './bots/test-bot';
import { call, initData, nowSeconds as now, pid, registerUser, testEnv as env } from './test-api';
import { localUsers } from './modules/users';
import { signTelegramData } from './shared/auth/test-signing';

// A new photo sends a card to the team (G51): no real Telegram in tests.
vi.stubGlobal('fetch', fakeTelegram().fetch);
afterAll(() => vi.unstubAllGlobals());

describe('Telegram auth on API routes', () => {
  it('accepts initData of the bot of the Mini App', async () => {
    const response = await call('/me', 10);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ state: 'unregistered', suggestedName: 'Ali' });
  });

  it('rejects initData of another bot, old, forged or missing data', async () => {
    const other = await initData(10, env.DRIVER_BOT_TOKEN);
    expect((await call('/me', 10, { data: other })).status).toBe(401);
    const old = await initData(10, env.PASSENGER_BOT_TOKEN, now() - 2 * 24 * 60 * 60);
    expect(await (await call('/me', 10, { data: old })).json()).toEqual({ error: 'auth.expired' });
    const forged = (await initData(10)).replace('Ali', 'Bob');
    expect(await (await call('/me', 10, { data: forged })).json()).toEqual({ error: 'auth.invalid' });
    expect((await app.request('/me', {}, env)).status).toBe(401);
    expect((await call('/me', 10, { app: 'unknown' })).status).toBe(401);
  });

  it('lets only the team into the admin Mini App', async () => {
    const token = env.ADMIN_BOT_TOKEN;
    expect((await call('/me', 10, { app: 'admin', data: await initData(10, token) })).status).toBe(403);
    expect((await call('/me', 900, { app: 'admin', data: await initData(900, token) })).status).toBe(200);
  });
});

describe('registration and profile over HTTP', () => {
  it('registers with a signed contact and hides the phone from others', async () => {
    expect((await registerUser(20)).status).toBe(201);
    expect((await registerUser(20)).status).toBe(409);
    const own = await (await call('/me', 20)).json();
    expect(own).toMatchObject({ state: 'active', profile: { phone: '+9989020' } });
    const other = await (await call(`/users/${await pid(20)}`, 21)).json();
    expect(other).toEqual({ id: await pid(20), firstName: 'Ali', hasAvatar: false, rating: null });
    // The random public id may hold any digits: the rest of the profile is checked for the phone.
    expect(JSON.stringify({ ...(other as object), id: null })).not.toMatch(/phone|username|998/);
    // The Telegram ID opens nothing: only the random public id does (docs/65 A3).
    expect((await call('/users/20', 21)).status).toBe(404);
    expect((await call('/users/404', 21)).status).toBe(404);
  });

  it('refuses a contact of another person or a broken form', async () => {
    const contact = await signTelegramData(
      env.PASSENGER_BOT_TOKEN,
      {
        contact: { user_id: 99, phone_number: '998900000099' },
      },
      now(),
    );
    const body = JSON.stringify({ consent: true, firstName: 'Ali', gender: 'male', contact });
    const init = { method: 'POST', body, headers: { 'content-type': 'application/json' } };
    expect(await (await call('/me/registration', 30, init)).json()).toEqual({
      error: 'users.invalid_contact',
    });
    const unsigned = JSON.stringify({
      consent: true,
      firstName: 'Ali',
      gender: 'male',
      contact: 'contact=%7B%7D',
    });
    expect((await call('/me/registration', 30, { ...init, body: unsigned })).status).toBe(400);
    expect((await call('/me/registration', 30, { ...init, body: '{}' })).status).toBe(400);
  });

  it('uploads an avatar and never shows a passenger photo to a stranger', async () => {
    await registerUser(40);
    const put = { method: 'PUT', body: new Uint8Array(100), headers: { 'content-type': 'image/jpeg' } };
    expect((await call('/me/avatar', 40, put)).status).toBe(204);
    const mine = await call(`/users/${await pid(40)}/avatar`, 40);
    expect(mine.status).toBe(200);
    expect(mine.headers.get('cache-control')).toBe('private, max-age=3600');
    expect((await call(`/users/${await pid(40)}/avatar`, 41)).status).toBe(404);
    const big = { ...put, headers: { 'content-type': 'image/jpeg', 'content-length': String(400 * 1024) } };
    expect((await call('/me/avatar', 40, big)).status).toBe(413);
    const access = {
      method: 'POST',
      body: '{"allowed":true}',
      headers: { 'content-type': 'application/json' },
    };
    expect((await call('/me/write-access', 40, access)).status).toBe(204);
    expect((await call('/me/write-access', 40, { ...access, body: '{}' })).status).toBe(400);
  });

  it('answers a blocked person only with the block', async () => {
    await registerUser(50);
    const user = await localUsers.find(50);
    if (user) await localUsers.save({ ...user, block: { until: null } });
    expect(await (await call('/me', 50)).json()).toEqual({ state: 'blocked', until: null });
    expect(await (await call('/users/20', 50)).json()).toEqual({ error: 'users.blocked', until: null });
  });
});
