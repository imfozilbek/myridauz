import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Bindings } from './env';
import worker from './index';
import { testEnv } from './test-api';
import { testD1 } from './test-d1';

// The Durable Object classes the entry exports need the runtime of Cloudflare; the Cron does not.
vi.mock('cloudflare:workers', () => ({ DurableObject: Object }));

const NOW = Date.UTC(2026, 9, 5, 0, 5);
const HOUR = 60 * 60 * 1000;
const TELEGRAM = 'http://telegram.test';
const controller = { cron: '*/15 * * * *', scheduledTime: NOW, noRetry: () => undefined };

// A trip that ended an hour ago, with its confirmed passenger: the Cron completes it.
const SEED = `PRAGMA foreign_keys = OFF;
INSERT INTO users (id, first_name, gender, phone, consent_at, created_at, updated_at, public_id)
  VALUES (1, 'Ali', 'male', '998901', 0, 0, 0, 'p1'), (2, 'Vali', 'male', '998902', 0, 0, 0, 'p2');
INSERT INTO driver_applications (user_id, status, submitted_at, updated_at) VALUES (1, 'approved', 0, 0);
INSERT INTO trips (id, driver_id, from_id, to_id, depart_at, ends_at, km, seats, price, status, created_at)
  VALUES ('t1', 1, '1726', '1718', ${NOW - 6 * HOUR}, ${NOW - HOUR}, 300, 4, 100000, 'active', 0);
INSERT INTO bookings (id, trip_id, passenger_id, seats, price, commission, status, expires_at, created_at, updated_at)
  VALUES ('b1', 't1', 2, 1, 100000, 10000, 'confirmed', 0, 0, 0);`;

const run = (env: object) =>
  worker.scheduled(controller as ScheduledController, { ...testEnv, ...env } as Bindings);

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// The Cron of wrangler.toml reaches the jobs of src/cron.ts through the entry of the Worker (G49, docs/111).
describe('the Cron of the Worker', () => {
  it('runs the jobs of the tick and talks to the Telegram the environment names', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: NOW });
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const sent = vi.fn<(url: string) => Promise<Response>>(async () =>
      Response.json({ ok: true, result: { message_id: 1 } }),
    );
    vi.stubGlobal('fetch', sent);
    const db = testD1();
    await db.exec(SEED);
    await run({ DB: db, TELEGRAM_API_URL: TELEGRAM });
    const trip = await db.prepare("SELECT status FROM trips WHERE id = 't1'").first<{ status: string }>();
    expect(trip?.status).toBe('completed');
    expect(sent).toHaveBeenCalled();
    // The host itself, not a prefix of the address: «http://telegram.test.other» is another host.
    expect(new Set(sent.mock.calls.map(([url]) => new URL(url).origin))).toEqual(new Set([TELEGRAM]));
  });

  it('counts each broken job as a server error on the dashboard', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', async () => Response.json({ ok: true, result: true }));
    const down = () => {
      throw new Error('D1 is down');
    };
    const writeDataPoint = vi.fn();
    await run({ DB: { prepare: down, batch: down, exec: down }, ANALYTICS: { writeDataPoint } });
    const codes = writeDataPoint.mock.calls.map(([point]) => (point as { blobs: string[] }).blobs);
    expect(codes).toContainEqual(['server_error', 'server', '', '', '', 'cron:completeTrips']);
    expect(codes).toContainEqual(['server_error', 'server', '', '', '', 'cron:expireBookings']);
  });
});
