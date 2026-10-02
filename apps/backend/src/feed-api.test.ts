import { afterAll, describe, expect, it, vi } from 'vitest';
import { approvedDriver, json, read } from './bookings-test-api';
import { signalledNotifier } from './modules/drivers/infrastructure/signalled-notifier';
import { signTicket } from './shared/auth/signed-ticket';
import { call, pid, registerUser, testEnv, doorBooking } from './test-api';
import { app } from './app';

vi.stubGlobal('fetch', async () => Response.json({ ok: true, result: { message_id: 1 } }));
afterAll(() => vi.unstubAllGlobals());

const DRIVER = 91;
const PASSENGER = 92;
// The owner of the test team (testEnv.ADMIN_TELEGRAM_IDS).
const OWNER = 900;

// A fake namespace: every signal and socket a Durable Object would get.
function fakeFeeds() {
  const seen: { name: string; path: string; app: string | null }[] = [];
  const feeds = {
    idFromName: (name: string) => name,
    get: (name: string) => ({
      fetch: async (request: Request) => {
        seen.push({ name, path: new URL(request.url).pathname, app: request.headers.get('x-feed-app') });
        return new Response(null, { status: 204 });
      },
    }),
  };
  return { feeds, seen };
}

describe('the personal channel (docs/64, G19)', () => {
  it('gives a ticket only to the signed person and opens only their own channel', async () => {
    await registerUser(PASSENGER);
    const { url } = await read<{ url: string }>(call('/feed/ticket', PASSENGER, { method: 'POST' }));
    expect(url).toMatch(/^ws:\/\/.+\/feed\/socket\?ticket=/u);
    const socket = new URL(url);
    const open = (search: string, env: object, upgrade = true) =>
      app.request(`/feed/socket${search}`, upgrade ? { headers: { upgrade: 'websocket' } } : {}, env);
    expect((await open('?ticket=forged', testEnv)).status).toBe(403);
    // A chat ticket is another kind: it never opens a personal channel.
    const chat = await signTicket(
      testEnv.PASSENGER_BOT_TOKEN,
      'chat-ticket',
      { userId: PASSENGER, app: 'passenger' },
      Date.now(),
    );
    expect((await open(`?ticket=${chat}`, testEnv)).status).toBe(403);
    expect((await open(socket.search, testEnv, false)).status).toBe(400);
    expect((await open(socket.search, testEnv)).status).toBe(503);
    const { feeds, seen } = fakeFeeds();
    expect((await open(socket.search, { ...testEnv, FEEDS: feeds })).status).toBe(204);
    expect(seen).toEqual([{ name: `u${PASSENGER}`, path: '/socket', app: 'passenger' }]);
    expect((await app.request('/feed/ticket', { method: 'POST' }, testEnv)).status).toBe(401);
  });

  it('tells the driver about a new booking and the passenger about the confirmation', async () => {
    const { feeds, seen } = fakeFeeds();
    const env = { ...testEnv, FEEDS: feeds };
    await approvedDriver(DRIVER);
    const trip = { from: '1726273', to: '1718401', departAt: Date.now() + 5 * 3_600_000, seats: 3 };
    const published = await read<{ id: string }>(
      call('/driver/trips', DRIVER, {
        app: 'driver',
        ...json({ ...trip, price: 90_000, womanOnBoard: false, pickupMode: 'both', comment: '' }),
      }),
    );
    seen.length = 0;
    const booking = await read<{ id: string }>(
      call(`/trips/${published.id}/bookings`, PASSENGER, { ...json(doorBooking(1)), env }),
    );
    expect(seen).toContainEqual({ name: `u${DRIVER}`, path: '/signal', app: 'driver' });
    expect(seen.some((item) => item.name === `u${PASSENGER}`)).toBe(false);
    seen.length = 0;
    await call(`/driver/bookings/${booking.id}/confirm`, DRIVER, { method: 'POST', app: 'driver', env });
    expect(seen).toContainEqual({ name: `u${PASSENGER}`, path: '/signal', app: 'passenger' });
  });

  it('tells a driver about a correction of the wallet by the owner', async () => {
    const { feeds, seen } = fakeFeeds();
    const body = { balance: 'main', amount: 10_000, reason: 'Kelmadi, qaytarildi' };
    await call(`/admin/wallets/${await pid(DRIVER)}/adjust`, OWNER, {
      app: 'admin',
      ...json(body),
      env: { FEEDS: feeds },
    });
    expect(seen).toEqual([{ name: `u${DRIVER}`, path: '/signal', app: 'driver' }]);
  });
});

describe('moderation signals (docs/64)', () => {
  it('tells the team about a new application and the driver and the team about a decision', async () => {
    const { feeds, seen } = fakeFeeds();
    const calls: string[] = [];
    const notifier = signalledNotifier(
      { FEEDS: feeds } as never,
      {
        submitted: async () => void calls.push('submitted'),
        decided: async () => void calls.push('decided'),
      },
      async () => [900, 901],
    );
    const application = { userId: 55 } as never;
    await notifier.submitted(application, {} as never);
    expect(seen.map((item) => `${item.name}:${item.app}`)).toEqual(['u900:admin', 'u901:admin']);
    seen.length = 0;
    await notifier.decided(application, null, null);
    expect(seen.map((item) => `${item.name}:${item.app}`)).toEqual([
      'u55:driver',
      'u900:admin',
      'u901:admin',
    ]);
    expect(calls).toEqual(['submitted', 'decided']);
  });
});
