import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Bindings } from '../../env';
import { testEnv } from '../../test-api';
import { fullScans } from '../../test-d1';
import { forgetTips, tipsOff } from './index';
import { ago, booking, DAY, HOUR, NOON, people, runTips, tipsDb, trip } from './tips-test-kit';

beforeAll(() => vi.useFakeTimers({ toFake: ['Date'] }));
afterAll(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

// Every person registered 30 h ago and did nothing (P2); each is quiet for its own reason.
const IDS = [11, 12, 13, 14, 15, 16, 17, 18];
const QUIET = `${people(...IDS, 30)}
  UPDATE users SET created_at = ${ago(30 * HOUR)} WHERE id IN (${IDS.join(', ')});
  UPDATE users SET deleted_at = ${ago(HOUR)} WHERE id = 12;
  UPDATE users SET blocked = 1 WHERE id = 13;
  INSERT INTO blocked_phones (phone, created_at) VALUES ('9989014', 0);
  INSERT INTO bot_blocks (bot, chat_id, blocked_at) VALUES ('passenger', 15, 0);
  INSERT INTO tips_off (user_id, off_at) VALUES (16, 0);
  INSERT INTO tips (user_id, step, sent_at) VALUES (17, 'd1', ${ago(3 * DAY)});`;
// 18 drives now: the trip left an hour ago; 19 rides in it and waits for offers to its request.
const RIDING = `${people(19)} ${trip('road', 18, ago(HOUR), NOON + 4 * HOUR)} ${booking('b19', 'road', 19, 'confirmed')}
  INSERT INTO ride_requests (id, passenger_id, from_id, to_id, date, expires_at, km, seats, price, status, created_at)
    VALUES ('r19', 19, '1718', '1726', '2026-10-06', ${NOON + DAY}, 300, 1, 100000, 'open', ${ago(8 * HOUR)});`;

// G70a (docs/232): no tip to a deleted, blocked or quiet person, nor to one on the road.
describe('the people a tip never reaches', () => {
  it('tells only the one who may hear it', async () => {
    const db = await tipsDb(`${QUIET} ${RIDING}`);
    const sent = await runTips(db);
    expect(sent.map((one) => one.chat)).toEqual([11]);
    expect(fullScans(db)).toEqual([]);
  });

  it('stops the tips at «Kerak emas» and forgets them with the account', async () => {
    const db = await tipsDb(`${people(11)} UPDATE users SET created_at = ${ago(30 * HOUR)};`);
    const env = { ...testEnv, DB: db } as unknown as Bindings;
    await tipsOff(env, 11);
    expect(await runTips(db)).toEqual([]);
    await forgetTips(env, 11);
    expect(await db.prepare('SELECT COUNT(*) AS n FROM tips_off').first()).toEqual({ n: 0 });
    expect(await runTips(db)).toHaveLength(1);
    await forgetTips(env, 11);
    expect(await db.prepare('SELECT COUNT(*) AS n FROM tips').first()).toEqual({ n: 0 });
  });
});
