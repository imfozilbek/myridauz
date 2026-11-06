import { describe, expect, it } from 'vitest';
import { fullScans, testD1 } from '../../test-d1';
import { createMemoryRequestPosts, d1RequestPosts } from './infrastructure/request-posts';

describe.each([
  ['D1', () => d1RequestPosts(testD1())],
  ['memory', createMemoryRequestPosts],
])('the group posts of a request, in %s (G94, docs/223)', (_store, make) => {
  it('keeps one post per request and group with the bot that sent it, and forgets the request whole', async () => {
    const posts = make();
    await posts.save({ requestId: 'r1', chat: '-1', messageId: 10, bot: 'poster' });
    await posts.save({ requestId: 'r1', chat: '-1', messageId: 11, bot: 'group' });
    await posts.save({ requestId: 'r1', chat: '-2', messageId: 12, bot: 'poster' });
    await posts.save({ requestId: 'r2', chat: '-1', messageId: 13, bot: 'poster' });
    expect((await posts.of('r1')).map(({ chat, messageId, bot }) => [chat, messageId, bot])).toEqual([
      ['-1', 11, 'group'],
      ['-2', 12, 'poster'],
    ]);
    await posts.forget('r1');
    expect([await posts.of('r1'), (await posts.of('r2')).length]).toEqual([[], 1]);
  });
});

describe('the group posts of requests in D1 and the free plan (docs/117)', () => {
  it('reads and forgets through the key, never the table whole', async () => {
    const db = testD1();
    const posts = d1RequestPosts(db);
    await posts.save({ requestId: 'r1', chat: '-1', messageId: 10, bot: 'poster' });
    await posts.of('r1');
    await posts.forget('r1');
    expect(fullScans(db)).toEqual([]);
  });
});
