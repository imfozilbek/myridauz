import { afterEach, describe, expect, it, vi } from 'vitest';
import { consumeNotifications, handleAfterSent } from '.';

const POST = {
  bot: 'poster',
  chatId: '@ch_samarqand',
  text: 'Toshkent → Samarqand',
  after: { type: 'channelPost', tripId: 't1', channel: '@ch_samarqand', shown: 'active 3 false' },
} as const;

afterEach(() => vi.unstubAllGlobals());

// G89 C9: the post is in the channel already; a failed bookkeeping after it never posts it again
// (docs/65 D, docs/122: one post a trip, its life is edits).
describe('a channel post whose bookkeeping failed', () => {
  it('is sent once and the queue lets it go', async () => {
    let posted = 0;
    vi.stubGlobal('fetch', async () => {
      posted += 1;
      return Response.json({ ok: true, result: { message_id: 40 } });
    });
    handleAfterSent(async () => {
      throw new Error('D1 hiccup');
    });
    const done: string[] = [];
    const message = { body: POST, attempts: 1, ack: () => done.push('ack'), retry: () => done.push('retry') };
    const tasks = { reminder: async () => undefined };
    await consumeNotifications({ messages: [message] } as never, { POSTER_BOT_TOKEN: 'c' }, tasks);
    expect(posted).toBe(1);
    expect(done).toEqual(['ack']);
    handleAfterSent(async () => undefined);
  });
});
