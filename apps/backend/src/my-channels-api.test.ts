import { loadBrand } from '@platform/brands';
import { MY_CHANNELS_PATH, type MyChannels } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { app } from './app';
import { read } from './bookings-test-api';
import { call, registerUser, testEnv } from './test-api';

const PERSON = 95;
const STRANGER = 96;
const GONE = 97;
const SECRET = 's';
const env = { ...testEnv, TELEGRAM_WEBHOOK_SECRET: SECRET };
const [first, second] = loadBrand().channels;
const FIRST = first?.chat ?? '';
const SECOND = second?.chat ?? '';

// A chat_member update of the bot of the posts: a person joins or leaves a channel at a second.
const heard = (chat: string, user: number, status: string, date: number, secret = SECRET) =>
  app.request(
    '/telegram/poster',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-telegram-bot-api-secret-token': secret },
      body: JSON.stringify({
        update_id: date,
        chat_member: { chat: { id: Number(chat) }, date, new_chat_member: { status, user: { id: user } } },
      }),
    },
    env,
  );
const mine = async (person: number, app = 'passenger') =>
  (await read<MyChannels>(call(MY_CHANNELS_PATH, person, { app }))).channels;
const joined = async (person: number) =>
  (await mine(person)).filter((channel) => channel.member).map((channel) => channel.chat);

describe('«Kanallar» through the API in both apps (G80, docs/176)', () => {
  it('marks the channels the bot of the posts heard the person join, in both apps', async () => {
    await registerUser(PERSON);
    expect((await heard(FIRST, PERSON, 'member', 10)).status).toBe(200);
    for (const app of ['passenger', 'driver'] as const) {
      const channels = await mine(PERSON, app);
      expect(channels).toHaveLength(loadBrand().channels.length);
      expect(channels.filter((channel) => channel.member)).toEqual([{ chat: FIRST, member: true }]);
    }
  });

  it('follows a leave, and an older update never wins over a newer one', async () => {
    await heard(SECOND, PERSON, 'member', 20);
    await heard(FIRST, PERSON, 'left', 30);
    await heard(FIRST, PERSON, 'member', 25);
    expect(await joined(PERSON)).toEqual([SECOND]);
  });

  it('keeps nobody outside the brand: a person without an account, a strange chat, a wrong secret', async () => {
    await heard(FIRST, STRANGER, 'member', 10);
    await registerUser(STRANGER);
    expect(await joined(STRANGER)).toEqual([]);
    await heard('-100999', STRANGER, 'member', 11);
    expect((await heard(FIRST, STRANGER, 'member', 12, 'x')).status).toBe(401);
    expect(await joined(STRANGER)).toEqual([]);
  });

  it('forgets the channels of a deleted account (docs/30)', async () => {
    await registerUser(GONE);
    await heard(FIRST, GONE, 'administrator', 10);
    expect(await joined(GONE)).toEqual([FIRST]);
    expect((await call('/me', GONE, { method: 'DELETE' })).status).toBe(204);
    await registerUser(GONE);
    expect(await joined(GONE)).toEqual([]);
  });
});
