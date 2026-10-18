import { describe, expect, it } from 'vitest';
import { signTelegramData } from './shared/auth/test-signing';
import { call, pid, registerUser, testEnv } from './test-api';

const PERSON = 70;
const OWNER = 900;
const SECOND = 1000;
const opened = async (username: string | undefined) =>
  call('/me', PERSON, {
    data: await signTelegramData(
      testEnv.PASSENGER_BOT_TOKEN,
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
      telegramId: PERSON,
      username: 'ali_tg',
    });
    expect((await call(path, 71)).status).toBe(403);
    await opened(undefined);
    expect(await (await call(path, OWNER, { app: 'admin' })).json()).toMatchObject({ username: null });
  });
});
