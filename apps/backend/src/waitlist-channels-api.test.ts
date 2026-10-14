import { loadBrand } from '@platform/brands';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { app } from './app';
import { json, read } from './bookings-test-api';
import { testD1 } from './test-d1';
import { call } from './test-api';

vi.stubGlobal('fetch', async (input: string) =>
  Response.json({
    ok: true,
    result: input.endsWith('createChatInviteLink') ? { invite_link: 'https://t.me/+ad' } : {},
  }),
);
afterAll(() => vi.unstubAllGlobals());

const env = { DB: testD1() };
const OWNER = 900;
const main = (id: number) => (path: string) => call(path, id, { app: 'main', env });
const answers = { role: 'passenger', pains: ['chats'], home: '1718', region: '1718', cadence: 'weekly' };

describe('the bot of the channels hears the people of the list (docs/176, docs/184)', () => {
  const chat = loadBrand().channels[0]?.chat ?? '';
  const heard = (user: number, status: string, invite?: string) =>
    app.request(
      '/telegram/poster',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-telegram-bot-api-secret-token': 's' },
        body: JSON.stringify({
          chat_member: {
            chat: { id: Number(chat) },
            date: 100,
            new_chat_member: { status, user: { id: user } },
            ...(invite ? { invite_link: { invite_link: invite } } : {}),
          },
        }),
      },
      { ...env, POSTER_BOT_TOKEN: '4:poster', TELEGRAM_WEBHOOK_SECRET: 's' },
    );

  it('keeps a person of the list in the channel and counts a join by the link of an ad', async () => {
    const input = {
      target: 'channel',
      channel: chat,
      place: 'telegram',
      name: 'Kanal',
      price: 1000,
      days: 1,
      top: 0,
      pin: 0,
    };
    const ad = await read<{ code: string }>(
      call('/admin/ad-links', OWNER, { app: 'admin', env, ...json(input) }),
    );
    await call('/waitlist', 1, { app: 'main', env, ...json(answers, 'PUT') });
    await heard(1, 'member', 'https://t.me/+ad');
    const me = await read<{ channels: string[] }>(main(1)('/waitlist'));
    expect(me.channels).toContain(chat);
    const result = await read<{ result: { joined: number; passengers: number } }>(
      call(`/admin/ad-links/${ad.code}`, OWNER, { app: 'admin', env }),
    );
    expect(result.result).toMatchObject({ joined: 1, passengers: 1 });
  });
});
