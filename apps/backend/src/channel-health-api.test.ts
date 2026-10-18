import { loadBrand } from '@platform/brands';
import { ADMIN_CHANNEL_HEALTH_PATH, channelHealthSchema } from '@platform/contracts';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { fakeTelegram } from './bots/test-bot';
import { checkChannelHealth } from './modules/channels';
import { changeModerator } from './modules/team';
import { app } from './app';
import { call, nowSeconds, registerUser, testEnv } from './test-api';

const telegram = fakeTelegram();
vi.stubGlobal('fetch', telegram.fetch);
afterAll(() => vi.unstubAllGlobals());
const OWNER = 900;
const SECRET = 's';
const MODERATOR = 956;
const read = (id: number) => call(ADMIN_CHANNEL_HEALTH_PATH, id, { app: 'admin' });
// An update of the bot of the posts with our secret (docs/176).
const hear = (update: object) =>
  app.request(
    '/telegram/poster',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-telegram-bot-api-secret-token': SECRET },
      body: JSON.stringify({ update_id: 1, ...update }),
    },
    { ...testEnv, TELEGRAM_WEBHOOK_SECRET: SECRET },
  );

// «Kanallar» of «Boshqaruv» (G75, docs/120): every channel of the brand with its health, the owner only.
describe('the health of the channels in the admin app', () => {
  it('lists every channel, the hourly Cron fills a few of them from Telegram', async () => {
    await registerUser(OWNER);
    await checkChannelHealth(testEnv);
    const health = channelHealthSchema.parse(await (await read(OWNER)).json());
    expect(health.channels.map((item) => item.chat)).toEqual(
      loadBrand().channels.map((channel) => channel.chat),
    );
    expect(health.channels.filter((item) => item.checkedAt !== null)).toHaveLength(3);
  });

  // G87 V5, V6 (docs/176): the joins and leaves of this week, of anyone, and the best post.
  it('counts who came to a channel and left it, by the old and the new state, and the reactions', async () => {
    const chat = loadBrand().channels[0]?.chat ?? '';
    const member = (user: number, was: string, is: string) => ({
      chat_member: {
        chat: { id: Number(chat) },
        date: nowSeconds(),
        old_chat_member: { status: was, user: { id: user } },
        new_chat_member: { status: is, user: { id: user } },
      },
    });
    await hear(member(501, 'left', 'member'));
    await hear(member(502, 'left', 'member'));
    await hear(member(501, 'member', 'left'));
    await hear(member(503, 'member', 'administrator'));
    const reactions = [
      { type: { type: 'emoji', emoji: '👍' }, total_count: 5 },
      { type: { type: 'paid' }, total_count: 1 },
    ];
    await hear({
      message_reaction_count: { chat: { id: Number(chat) }, message_id: 42, date: nowSeconds(), reactions },
    });
    const health = channelHealthSchema.parse(await (await read(OWNER)).json());
    expect(health.channels.find((item) => item.chat === chat)).toMatchObject({
      joined: 2,
      left: 1,
      topPost: { messageId: 42, reactions: 6 },
    });
  });

  it("is the owner's only", async () => {
    expect(await changeModerator(testEnv, OWNER, MODERATOR, true)).toBe('ok');
    const refused = await read(MODERATOR);
    expect([refused.status, await refused.json()]).toEqual([403, { error: 'auth.not_owner' }]);
  });
});
