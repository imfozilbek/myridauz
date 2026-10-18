import { loadBrand } from '@platform/brands';
import { ADMIN_CHANNEL_HEALTH_PATH, channelHealthSchema } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { app } from './app';
import { createMemoryChannelLife, d1ChannelLife } from './modules/channels/infrastructure/channel-life';
import { channelLifeOf } from './modules/channels/life-deps';
import { call, registerUser, testEnv } from './test-api';
import { fullScans, testD1 } from './test-d1';

const OWNER = 900;
const SECRET = 's';
const env = { ...testEnv, TELEGRAM_WEBHOOK_SECRET: SECRET };
const [first, second] = loadBrand().channels;
const FIRST = first?.chat ?? '';
const SECOND = second?.chat ?? '';
const NOW = Math.floor(Date.now() / 1000);

const poster = (update: object, on: object = env) =>
  app.request(
    '/telegram/poster',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-telegram-bot-api-secret-token': SECRET },
      body: JSON.stringify({ update_id: 1, ...update }),
    },
    on,
  );
const member = (status: string, user = 77) => ({
  status,
  user: { id: user },
  // A restricted person is still in the channel.
  ...(status === 'restricted' ? { is_member: true } : {}),
});
// A person of anyone joins or leaves: counted, never kept (docs/30).
const moved = (chat: string, was: string, now: string, user?: number) =>
  poster({
    chat_member: {
      chat: { id: Number(chat) },
      date: NOW,
      old_chat_member: member(was, user),
      new_chat_member: member(now, user),
    },
  });
const reacted = (chat: string, messageId: number, counts: number[], date = NOW, username?: string) =>
  poster({
    message_reaction_count: {
      chat: { id: Number(chat), ...(username ? { username } : {}) },
      message_id: messageId,
      date,
      reactions: counts.map((total) => ({ type: { type: 'emoji', emoji: '👍' }, total_count: total })),
    },
  });

// G87 (docs/191): «Kanallar» of the owner shows who joined and left this week and the reactions.
describe('the life of the channels through the bot of the posts', () => {
  it('counts the joins, the leaves and the reactions of the posts of each channel', async () => {
    await registerUser(OWNER);
    for (const user of [1, 2, 3]) expect((await moved(FIRST, 'left', 'member', user)).status).toBe(200);
    await moved(FIRST, 'member', 'left', 1);
    // A changed right of a member is no join.
    await moved(FIRST, 'member', 'restricted');
    await reacted(FIRST, 10, [4, 2]);
    await reacted(FIRST, 11, [1]);
    // An older count of a post never wins over a newer one.
    await reacted(FIRST, 10, [1], NOW - 60);
    await reacted(SECOND, 12, [3]);
    const health = channelHealthSchema.parse(
      await (await call(ADMIN_CHANNEL_HEALTH_PATH, OWNER, { app: 'admin' })).json(),
    );
    const life = (chat: string) => health.channels.find((one) => one.chat === chat);
    expect(life(FIRST)).toMatchObject({ joined: 3, gone: 1, reactions: 7, topReactions: 6 });
    expect(life(SECOND)).toMatchObject({ joined: 0, gone: 0, reactions: 3, topReactions: 3 });
  });

  it('reads a week of D1 through the keys, the same as in memory', async () => {
    const db = testD1();
    const DAY = 24 * 3600 * 1000;
    const at = Date.parse('2026-10-18T10:00:00Z');
    for (const life of [d1ChannelLife(db), createMemoryChannelLife()]) {
      await life.moved('2026-10-18', '-1001', 'joined');
      await life.moved('2026-10-18', '-1001', 'joined');
      await life.moved('2026-10-10', '-1001', 'gone');
      await life.counted('2026-10-18', '-1001', 120);
      await life.reacted('-1001', 5, 3, at);
      await life.reacted('-1001', 6, 8, at - DAY);
      await life.reacted('-1001', 7, 9, at - 9 * DAY);
      expect(await life.since('2026-10-12', at - 7 * DAY)).toEqual(
        new Map([['-1001', { joined: 2, gone: 0, reactions: 11, topReactions: 8 }]]),
      );
    }
    expect(fullScans(db)).toEqual([]);
  });

  it('knows a public channel by its name in any case of letters', async () => {
    await reacted('-1009', 20, [5], NOW, 'Big_Channel');
    const week = await channelLifeOf(env).since('2000-01-01', 0);
    expect(week.get('@big_channel')).toMatchObject({ reactions: 5 });
  });

  it('answers 200 when a count fails, so Telegram never sends the update again', async () => {
    const db = testD1();
    const prepare = (sql: string) => {
      if (/channel_days|post_reactions/u.test(sql)) throw new Error('d1.down');
      return db.prepare(sql);
    };
    const failing = { ...env, DB: { ...db, prepare } };
    expect(
      (
        await poster(
          { message_reaction_count: { chat: { id: -1001 }, message_id: 1, date: NOW, reactions: [] } },
          failing,
        )
      ).status,
    ).toBe(200);
  });
});
