import { beforeEach, describe, expect, it } from 'vitest';
import type { Bindings } from '../../env';
import { testD1 } from '../../test-d1';
import { d1Unread, forgetUnread, lastUnread, unreadOf } from './infrastructure/d1-unread';

// The plate «1 xabar» on SQLite with the real migrations (G53).
const BOOKING = 'b00000000-0000-4000-8000-000000000001';
const OFFER = 'o00000000-0000-4000-8000-000000000002';
const PASSENGER = { userId: 10, role: 'passenger' } as const;
const AS_DRIVER = { userId: 10, role: 'driver' } as const;
const TALK = 't00000000-0000-4000-8000-000000000003';
let env: Bindings;

beforeEach(() => {
  env = { DB: testD1() } as Bindings;
});

describe('the unread messages of a chat (G53)', () => {
  it('counts each message of a chat apart and forgets them when the chat opens', async () => {
    await d1Unread(env, BOOKING).add(PASSENGER, { text: 'Salom', at: 1 });
    await d1Unread(env, BOOKING).add(PASSENGER, { text: 'Keldim', at: 2 });
    await d1Unread(env, OFFER).add(PASSENGER, { text: 'Ha', at: 3 });
    expect(Object.fromEntries(await unreadOf(env, 10))).toEqual({ [BOOKING]: 2, [OFFER]: 1 });
    expect((await unreadOf(env, 1)).size).toBe(0);
    await d1Unread(env, BOOKING).clear(10);
    expect(Object.fromEntries(await unreadOf(env, 10))).toEqual({ [OFFER]: 1 });
  });

  it('keeps the last message of each chat for the sheet of one Mini App, the newest first (G68)', async () => {
    await d1Unread(env, BOOKING).add(PASSENGER, { text: 'Salom', at: 1 });
    await d1Unread(env, TALK).add(AS_DRIVER, { text: 'Qayerdasiz?', at: 2 });
    await d1Unread(env, BOOKING).add(PASSENGER, { text: 'Grand oldida boʻlaman', at: 3 });
    await d1Unread(env, OFFER).add(PASSENGER, { text: 'Ha', at: 2 });
    expect(await lastUnread(env, 10, 'passenger')).toEqual([
      { key: BOOKING, count: 2, text: 'Grand oldida boʻlaman', at: 3 },
      { key: OFFER, count: 1, text: 'Ha', at: 2 },
    ]);
    expect(await lastUnread(env, 10, 'driver')).toEqual([{ key: TALK, count: 1, text: 'Qayerdasiz?', at: 2 }]);
  });

  it('forgets every counter of a deleted account', async () => {
    await d1Unread(env, BOOKING).add(PASSENGER, { text: 'Salom', at: 1 });
    await forgetUnread(env, 10);
    expect((await unreadOf(env, 10)).size).toBe(0);
  });
});
