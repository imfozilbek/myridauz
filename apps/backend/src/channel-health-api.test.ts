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

  // G87 V5 (docs/176): the joins and leaves the bot of the posts heard this week, of anyone.
  it('counts who came to a channel and left it, by the old and the new state', async () => {
    const chat = loadBrand().channels[0]?.chat ?? '';
    const update = (user: number, was: string, is: string) =>
      app.request(
        '/telegram/poster',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-telegram-bot-api-secret-token': SECRET },
          body: JSON.stringify({
            update_id: user,
            chat_member: {
              chat: { id: Number(chat) },
              date: nowSeconds(),
              old_chat_member: { status: was, user: { id: user } },
              new_chat_member: { status: is, user: { id: user } },
            },
          }),
        },
        { ...testEnv, TELEGRAM_WEBHOOK_SECRET: SECRET },
      );
    await update(501, 'left', 'member');
    await update(502, 'left', 'member');
    await update(501, 'member', 'left');
    await update(503, 'member', 'administrator');
    const health = channelHealthSchema.parse(await (await read(OWNER)).json());
    expect(health.channels.find((item) => item.chat === chat)).toMatchObject({ joined: 2, left: 1 });
  });

  it("is the owner's only", async () => {
    expect(await changeModerator(testEnv, OWNER, MODERATOR, true)).toBe('ok');
    const refused = await read(MODERATOR);
    expect([refused.status, await refused.json()]).toEqual([403, { error: 'auth.not_owner' }]);
  });
});
