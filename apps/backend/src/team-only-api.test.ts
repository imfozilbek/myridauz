import { loadBrand } from '@platform/brands';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { app } from './app';
import { botEnv, botSender, fakeTelegram, textMessage } from './bots/test-bot';
import { call, testEnv } from './test-api';

const telegram = fakeTelegram();
vi.stubGlobal('fetch', telegram.fetch);
afterAll(() => vi.unstubAllGlobals());
const INTERNAL = { ENVIRONMENT: 'internal' };
const OWNER = 900;
const OUTSIDER = 501;
const send = botSender(telegram.fetch);
const reply = async (response: Response) =>
  (await response.json()) as { text?: string; reply_markup?: { inline_keyboard: { url?: string }[][] } };
const joins = (user: number, env: object) =>
  app.request(
    '/telegram/poster',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-telegram-bot-api-secret-token': 'hook' },
      body: JSON.stringify({
        chat_member: {
          chat: { id: -100 },
          date: 1,
          new_chat_member: { status: 'member', user: { id: user } },
        },
      }),
    },
    { ...testEnv, TELEGRAM_WEBHOOK_SECRET: 'hook', ...env },
  );
const kicks = () => telegram.calls.filter((sent) => sent.method === 'banChatMember');

// Owner, 17.10.2026: the bots, Mini Apps and channels of the internal environment are for the team;
// anyone else is sent to production.
describe('the internal environment is for the team only', () => {
  it('shows a person outside the team the way out of the Mini Apps, never the team', async () => {
    const outsider = await call('/me', OUTSIDER, { env: INTERNAL });
    expect(outsider.status).toBe(403);
    expect(await outsider.json()).toEqual({ error: 'auth.moved' });
    expect((await call('/me', OWNER, { env: INTERNAL })).status).toBe(200);
    expect((await call('/me', OUTSIDER)).status).toBe(200);
  });

  it('answers a person outside the team with the same bot of production', async () => {
    const internal = { ...botEnv, ...INTERNAL };
    const moved = await reply(await send('driver', textMessage(OUTSIDER, '/start'), 'hook', internal));
    expect(moved.text).toBe('Bu bot faqat jamoa uchun. Safarlar yangi botda: pastdagi tugmani bosing.');
    expect(moved.reply_markup?.inline_keyboard[0]?.[0]?.url).toBe(`https://t.me/${loadBrand().bots.driver}`);
    const team = await reply(await send('driver', textMessage(7, '/start'), 'hook', internal));
    expect(JSON.stringify(team)).not.toContain('faqat jamoa');
    const people = await reply(await send('driver', textMessage(OUTSIDER, '/start')));
    expect(JSON.stringify(people)).not.toContain('faqat jamoa');
  });

  it('takes a person outside the team out of a channel of the team, nobody else', async () => {
    await joins(OUTSIDER, INTERNAL);
    expect(kicks().map((sent) => sent.body.user_id)).toEqual([OUTSIDER]);
    expect(telegram.calls.at(-1)).toMatchObject({
      method: 'unbanChatMember',
      body: { only_if_banned: true },
    });
    await joins(OWNER, INTERNAL);
    await joins(OUTSIDER, {});
    expect(kicks()).toHaveLength(1);
  });
});
