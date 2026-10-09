import { afterAll, describe, expect, it, vi } from 'vitest';
import { fakeTelegram } from './bots/test-bot';
import { approvedDriver, json, OWNER, read } from './bookings-test-api';
import { changeModerator } from './modules/team';
import { call, pid, registerUser, testEnv, doorBooking } from './test-api';

const telegram = fakeTelegram();
vi.stubGlobal('fetch', telegram.fetch);
afterAll(() => vi.unstubAllGlobals());

const DRIVER = 81;
const PASSENGER = 82;
const MODERATOR = 83;
const trip = {
  from: '1726273',
  to: '1718401',
  departAt: Date.now() + 5 * 3_600_000,
  seats: 3,
  price: 90_000,
};
const block = (days: number | null) => ({ app: 'admin', ...json({ days }) });

describe('a block from the admin app (docs/17, docs/65 A5)', () => {
  it('cancels the driver trips and bookings, tells the passenger, and never blocks the team', async () => {
    await approvedDriver(DRIVER);
    await registerUser(PASSENGER);
    await registerUser(MODERATOR);
    expect(await changeModerator(testEnv, OWNER, MODERATOR, true)).toBe('ok');
    const input = { ...trip, womanOnBoard: false, pickupMode: 'door', comment: '' };
    const published = await read<{ id: string }>(
      call('/driver/trips', DRIVER, { app: 'driver', ...json(input) }),
    );
    const asked = await read<{ id: string }>(
      call(`/trips/${published.id}/bookings`, PASSENGER, json(doorBooking(1))),
    );
    await call(`/driver/bookings/${asked.id}/confirm`, DRIVER, { method: 'POST', app: 'driver' });
    const before = telegram.sentTo(PASSENGER).length;
    expect((await call(`/admin/users/${await pid(DRIVER)}/block`, MODERATOR, block(7))).status).toBe(204);
    const mine = await read<{ bookings: { id: string; status: string }[] }>(
      call('/passenger/bookings', PASSENGER),
    );
    expect(mine.bookings.find((booking) => booking.id === asked.id)?.status).toBe('cancelled_by_driver');
    expect(telegram.sentTo(PASSENGER).length).toBeGreaterThan(before);
    // The seat is gone: «Boshqa safar topish» opens the same route and day (docs/89 S10).
    expect(JSON.stringify(telegram.sentTo(PASSENGER).map((sent) => sent.body))).toContain('?find=');
    // The trip card of the driver bot says so and leaves the top of the chat (G68).
    expect(JSON.stringify(telegram.sentTo(DRIVER))).toContain('❌ Safar bekor qilindi');
    expect(telegram.sentTo(DRIVER).some((sent) => sent.method === 'unpinChatMessage')).toBe(true);
    // A moderator never blocks a member of the team; the owner may.
    const refused = await call(`/admin/users/${await pid(MODERATOR)}/block`, MODERATOR, block(null));
    expect([refused.status, await refused.json()]).toEqual([403, { error: 'auth.not_owner' }]);
    expect((await call(`/admin/users/${await pid(PASSENGER)}/block`, OWNER, block(1))).status).toBe(204);
    // The journal says who blocked and why; only the owner lifts a block (docs/65 C).
    const journal = async () =>
      read<{ active: unknown; entries: { reason: string }[] }>(
        call(`/admin/users/${await pid(PASSENGER)}/blocks`, MODERATOR, { app: 'admin' }),
      );
    expect(await journal()).toMatchObject({
      active: { until: expect.any(Number) },
      entries: [{ reason: 'admin' }],
    });
    const unblock = { method: 'POST', app: 'admin' };
    expect((await call(`/admin/users/${await pid(PASSENGER)}/unblock`, MODERATOR, unblock)).status).toBe(403);
    expect((await call(`/admin/users/${await pid(PASSENGER)}/unblock`, OWNER, unblock)).status).toBe(204);
    expect(await journal()).toMatchObject({
      active: null,
      entries: [{ reason: 'admin' }, { reason: 'unblock' }],
    });
    expect(await read(call('/me', PASSENGER))).toMatchObject({ state: 'active' });
  });
});
