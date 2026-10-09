import { afterEach, describe, expect, it, vi } from 'vitest';
import { runJobs } from './cron-jobs';
import { cronJobs } from './cron';
import type { Bindings } from './env';
import { testEnv } from './test-api';
import { fullScans, testD1 } from './test-d1';

const HOUR = 60 * 60 * 1000;
// 00:05 UTC: the first tick of the daily hour runs every job.
const NOW = Date.UTC(2026, 9, 5, 0, 5);
const ago = (hours: number) => NOW - hours * HOUR;

// One row for each job to work on, so that every read of every job runs (G56).
const SEED = `PRAGMA foreign_keys = OFF;
INSERT INTO users (id, first_name, gender, phone, consent_at, created_at, updated_at, public_id)
  VALUES (1, 'Ali', 'male', '998901', 0, 0, 0, 'p1'), (2, 'Vali', 'male', '998902', 0, 0, 0, 'p2'),
  (3, 'Soli', 'male', '998903', 0, 0, 0, 'p3');
INSERT INTO driver_applications (user_id, status, submitted_at, updated_at)
  VALUES (1, 'approved', 0, 0), (2, 'approved', 0, 0), (3, 'pending', ${ago(1)}, ${ago(1)});
INSERT INTO wallet_operations (id, driver_id, kind, balance, amount, expires_at, created_at)
  VALUES ('w1', 1, 'bonus_grant', 'bonus', 1000, ${ago(1)}, ${ago(900)}),
  ('w2', 2, 'bonus_grant', 'bonus', 1000, ${ago(-60)}, ${ago(600)});
INSERT INTO trips (id, driver_id, from_id, to_id, depart_at, ends_at, km, seats, price, status, created_at)
  VALUES ('t1', 1, '1726', '1718', ${ago(6)}, ${ago(1)}, 300, 4, 100000, 'active', 0),
  ('t2', 1, '1726', '1718', ${ago(40)}, ${ago(35)}, 300, 4, 100000, 'completed', 0),
  ('t3', 1, '1726', '1718', ${ago(-3)}, ${ago(-8)}, 300, 4, 100000, 'active', 0),
  ('t4', 2, '1726', '1718', ${ago(1.5)}, ${ago(-5)}, 300, 4, 100000, 'active', 0);
INSERT INTO bookings (id, trip_id, passenger_id, seats, price, commission, status, expires_at, created_at, updated_at)
  VALUES ('b1', 't1', 2, 1, 100000, 10000, 'confirmed', 0, 0, 0),
  ('b2', 't2', 2, 1, 100000, 10000, 'completed', 0, 0, 0),
  ('b3', 't3', 2, 1, 100000, 10000, 'requested', ${ago(1)}, 0, 0);
INSERT INTO rating_asks (booking_id, rater_id, ratee_id, asked_at) VALUES ('b2', 2, 1, ${ago(30)});
INSERT INTO channel_posts (trip_id, channel, message_id, depart_at) VALUES ('t1', '@yol', 5, ${ago(6)});
INSERT INTO route_subscriptions (id, user_id, kind, from_id, to_id, expires_at, pending, created_at)
  VALUES ('s1', 2, 'trips', '1726', '1718', ${ago(-24)}, 1, 0), ('s2', 2, 'trips', '1726', '1718', ${ago(1)}, 0, 0);
INSERT INTO complaints (id, author_id, against_id, booking_id, reason, status, created_at)
  VALUES ('c1', 2, 1, 'b2', 'late', 'new', ${ago(2)});
INSERT INTO ride_requests (id, passenger_id, from_id, to_id, date, expires_at, km, seats, price, status, created_at)
  VALUES ('r1', 2, '1726', '1718', '2026-01-01', ${ago(1)}, 300, 1, 100000, 'open', 0);
INSERT INTO support_messages (person_id, at, author, name, kind, text) VALUES (2, 0, 'person', 'Vali', 'text', 'hi');`;

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// The Cron runs every 15 minutes: a job that reads a growing table whole eats the free D1 quota
// in a few months (G56, docs/117). Every job reads only through an index.
describe('the reads of the Cron', () => {
  it('reads no growing table whole', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: NOW });
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', async () => Response.json({ ok: true, result: { message_id: 1 } }));
    const db = testD1();
    await db.exec(SEED);
    const env = { ...testEnv, DB: db } as unknown as Bindings;
    const jobs = cronJobs(env, NOW);
    expect(jobs).toHaveLength(18);
    expect(await runJobs(jobs)).toEqual([]);
    expect(fullScans(db)).toEqual([]);
  });

  it('runs the rare jobs once an hour and once a day', () => {
    const names = (at: number) => cronJobs({ ...testEnv } as unknown as Bindings, at).map(([name]) => name);
    expect(names(NOW + 15 * 60_000)).toHaveLength(8);
    expect(names(NOW + 5 * HOUR)).toEqual([...names(NOW + 15 * 60_000), ...names(NOW).slice(8, 14)]);
    expect(names(NOW).slice(14)).toEqual([
      'grantMissedBonuses',
      'warnBonusEnd',
      'purgeSupport',
      'forgetOldCards',
    ]);
    // The stand runs the Cron by hand at any minute: every job runs.
    const stand = { ...testEnv, CRON_TIERS: 'off' } as unknown as Bindings;
    expect(cronJobs(stand, NOW + 15 * 60_000)).toHaveLength(18);
  });
});
