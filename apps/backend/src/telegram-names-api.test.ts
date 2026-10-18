import { loadBrand } from '@platform/brands';
import { describe, expect, it } from 'vitest';
import { signTelegramData } from './shared/auth/test-signing';
import { call, pid, registerUser, testEnv } from './test-api';

const PERSON = 70;
const OWNER = 900;
const SECOND = 1000;
const { bots } = loadBrand();
const opened = async (username: string | undefined, app: 'passenger' | 'driver' = 'passenger') =>
  call('/me', PERSON, {
    app,
    data: await signTelegramData(
      app === 'driver' ? testEnv.DRIVER_BOT_TOKEN : testEnv.PASSENGER_BOT_TOKEN,
      { user: { id: PERSON, first_name: 'Ali', ...(username ? { username } : {}) } },
      Math.floor(Date.now() / SECOND),
    ),
  });

// Owner, 17.10.2026: the team sees who the person is in Telegram in its checks, nobody else.
describe('the Telegram account in the checks of the team', () => {
  it('keeps the public name of the account and gives it only to the team', async () => {
    await registerUser(PERSON);
    expect((await opened('ali_tg')).status).toBe(200);
    const path = `/admin/people/${await pid(PERSON)}/telegram`;
    expect(await (await call(path, OWNER, { app: 'admin' })).json()).toEqual({
      username: 'ali_tg',
      profileLink: `https://t.me/${bots.passenger}?start=profile_${await pid(PERSON)}`,
    });
    expect((await call(path, 71)).status).toBe(403);
    await opened(undefined);
    expect(await (await call(path, OWNER, { app: 'admin' })).json()).toMatchObject({ username: null });
  });

  // Owner, 18.10.2026: the profile opens through the bot whose Mini App the person opened last.
  it('links the profile through the bot the person knows', async () => {
    expect((await opened(undefined, 'driver')).status).toBe(200);
    const path = `/admin/people/${await pid(PERSON)}/telegram`;
    const { profileLink } = (await (await call(path, OWNER, { app: 'admin' })).json()) as {
      profileLink: string;
    };
    expect(profileLink).toBe(`https://t.me/${bots.driver}?start=profile_${await pid(PERSON)}`);
  });
});
