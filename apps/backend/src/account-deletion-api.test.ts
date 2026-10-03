import { afterAll, describe, expect, it, vi } from 'vitest';
import { app } from './app';
import { approvedDriver, json, read } from './bookings-test-api';
import { recordSupport, supportTalk } from './modules/support';
import { localUsers } from './modules/users';
import { call, initData, pid, registerUser, testEnv, doorBooking } from './test-api';

vi.stubGlobal('fetch', async () => Response.json({ ok: true, result: { message_id: 1 } }));
afterAll(() => vi.unstubAllGlobals());

const DRIVER = 171;
const PASSENGER = 172;
const trip = {
  from: '1726273',
  to: '1718401',
  departAt: Date.now() + 5 * 3_600_000,
  seats: 3,
  price: 90_000,
  womanOnBoard: false,
  pickupMode: 'both',
  comment: '',
};

// A Durable Object namespace that remembers which chat rooms were asked to forget (docs/07).
function fakeChats() {
  const forgotten: string[] = [];
  const chats = {
    idFromName: (name: string) => name,
    get: (name: string) => ({
      fetch: async (request: Request) => {
        if (new URL(request.url).pathname === '/forget') forgotten.push(name);
        return new Response(null, { status: 204 });
      },
    }),
  };
  return { chats, forgotten };
}

async function deleteMe(id: number, chats: unknown, miniApp = 'passenger') {
  const token = miniApp === 'driver' ? testEnv.DRIVER_BOT_TOKEN : testEnv.PASSENGER_BOT_TOKEN;
  const headers = { authorization: `tma ${await initData(id, token)}`, 'x-mini-app': miniApp };
  return app.request('/me', { method: 'DELETE', headers }, { ...testEnv, CHATS: chats });
}

describe('"Maʼlumotlarimni oʻchirish" (docs/30)', () => {
  it('erases a passenger, ends the bookings, forgets chats, favorites and subscriptions', async () => {
    await approvedDriver(DRIVER);
    await registerUser(PASSENGER);
    const published = await read<{ id: string }>(
      call('/driver/trips', DRIVER, { app: 'driver', ...json(trip) }),
    );
    const booking = await read<{ id: string; chatKey: string }>(
      call(`/trips/${published.id}/bookings`, PASSENGER, json(doorBooking(1))),
    );
    await call(`/passenger/favorites/${await pid(DRIVER)}`, PASSENGER, { method: 'PUT' });
    const route = { from: '1726', to: '1718', date: null, woman: false };
    await call('/passenger/subscriptions', PASSENGER, json(route));
    const said = {
      personId: PASSENGER,
      at: Date.now(),
      author: 'person' as const,
      name: 'Ali',
      kind: 'text' as const,
    };
    await recordSupport(testEnv, { ...said, text: 'Pulim qaytmadi' });
    const { chats, forgotten } = fakeChats();
    expect((await deleteMe(PASSENGER, chats)).status).toBe(204);
    // The support talk goes with the account (G32).
    expect(await supportTalk(testEnv, PASSENGER)).toEqual([]);
    expect(forgotten).toEqual([booking.chatKey]);
    expect(await localUsers.find(PASSENGER)).toBeUndefined();
    expect(await read(call('/me', PASSENGER))).toMatchObject({ state: 'unregistered' });
    const seen = await read<{ bookings: { id: string; status: string }[] }>(
      call('/driver/bookings', DRIVER, { app: 'driver' }),
    );
    expect(seen.bookings.find((item) => item.id === booking.id)?.status).not.toBe('requested');
    // The person can come back as a new one: nothing of the old account follows.
    expect((await registerUser(PASSENGER)).status).toBe(201);
    expect(await read(call('/passenger/favorites', PASSENGER))).toMatchObject({ drivers: [], trips: [] });
    expect(await read(call('/passenger/subscriptions', PASSENGER))).toMatchObject({ subscriptions: [] });
    expect((await deleteMe(404, chats)).status).toBe(409);
  });

  it('erases a driver: the trips end and the car is no longer theirs', async () => {
    // Two days after the trip of the test before: the trips of one driver cannot overlap (docs/103).
    const later = { ...trip, departAt: trip.departAt + 2 * 86_400_000 };
    const published = await read<{ id: string }>(
      call('/driver/trips', DRIVER, { app: 'driver', ...json(later) }),
    );
    expect((await deleteMe(DRIVER, fakeChats().chats, 'driver')).status).toBe(204);
    expect(await read(call(`/trips/${published.id}`, PASSENGER))).toEqual({ error: 'trips.not_found' });
    await registerUser(DRIVER);
    const me = await read<{ profile: { roles: string[] } }>(call('/me', DRIVER, { app: 'driver' }));
    expect(me.profile.roles).not.toContain('driver');
    const application = await read<{ status: string }>(
      call('/driver/application', DRIVER, { app: 'driver' }),
    );
    expect(application.status).not.toBe('approved');
  });

  it('keeps a block: a blocked person cannot delete the account to come back (docs/17)', async () => {
    await registerUser(173);
    const user = await localUsers.find(173);
    if (user) await localUsers.save({ ...user, block: { until: null } });
    const response = await deleteMe(173, fakeChats().chats);
    expect(await response.json()).toMatchObject({ error: 'users.blocked' });
    expect(await localUsers.find(173)).toBeDefined();
  });
});
