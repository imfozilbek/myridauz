import { loadBrand } from '@platform/brands';
import { ADMIN_CHANNEL_HEALTH_PATH, channelHealthSchema } from '@platform/contracts';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { fakeTelegram } from './bots/test-bot';
import { checkChannelHealth } from './modules/channels';
import { changeModerator } from './modules/team';
import { call, registerUser, testEnv } from './test-api';

const telegram = fakeTelegram();
vi.stubGlobal('fetch', telegram.fetch);
afterAll(() => vi.unstubAllGlobals());
const OWNER = 900;
const MODERATOR = 956;
const read = (id: number) => call(ADMIN_CHANNEL_HEALTH_PATH, id, { app: 'admin' });

// «Kanallar» of «Boshqaruv» (G75, docs/120): every channel of the brand with its health, the owner only.
describe('the health of the channels in the admin app', () => {
  it('lists every channel, the hourly Cron fills a few of them from Telegram', async () => {
    await registerUser(OWNER);
    await checkChannelHealth(testEnv);
    const health = channelHealthSchema.parse(await (await read(OWNER)).json());
    expect(health.channels.map((item) => item.username)).toEqual(
      loadBrand().channels.map((zone) => zone.username),
    );
    expect(health.channels.filter((item) => item.checkedAt !== null)).toHaveLength(3);
  });

  it("is the owner's only", async () => {
    expect(await changeModerator(testEnv, OWNER, MODERATOR, true)).toBe('ok');
    const refused = await read(MODERATOR);
    expect([refused.status, await refused.json()]).toEqual([403, { error: 'auth.not_owner' }]);
  });
});
