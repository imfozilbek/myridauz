import { beforeEach, describe, expect, it } from 'vitest';
import type { Bindings } from '../../env';
import { testD1 } from '../../test-d1';
import { d1Unread, forgetUnread, unreadOf } from './infrastructure/d1-unread';

// The plate «1 xabar» on SQLite with the real migrations (G53).
const BOOKING = 'b00000000-0000-4000-8000-000000000001';
const OFFER = 'o00000000-0000-4000-8000-000000000002';
const PASSENGER = { userId: 10, role: 'passenger' } as const;
let env: Bindings;

beforeEach(() => {
  env = { DB: testD1() } as Bindings;
});

describe('the unread messages of a chat (G53)', () => {
  it('counts each message of a chat apart and forgets them when the chat opens', async () => {
    await d1Unread(env, BOOKING).add(PASSENGER);
    await d1Unread(env, BOOKING).add(PASSENGER);
    await d1Unread(env, OFFER).add(PASSENGER);
    expect(Object.fromEntries(await unreadOf(env, 10))).toEqual({ [BOOKING]: 2, [OFFER]: 1 });
    expect((await unreadOf(env, 1)).size).toBe(0);
    await d1Unread(env, BOOKING).clear(10);
    expect(Object.fromEntries(await unreadOf(env, 10))).toEqual({ [OFFER]: 1 });
  });

  it('forgets every counter of a deleted account', async () => {
    await d1Unread(env, BOOKING).add(PASSENGER);
    await forgetUnread(env, 10);
    expect((await unreadOf(env, 10)).size).toBe(0);
  });
});
