import { chatKeyOfBooking, chatTicketPath, tripArrivePath, tripDepartPath } from '@platform/contracts';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { fakeTelegram } from './bots/test-bot';
import { approvedDriver, json, OWNER, read } from './bookings-test-api';
import { call, pid, registerUser, doorBooking } from './test-api';

const telegram = fakeTelegram();
vi.stubGlobal('fetch', telegram.fetch);
afterAll(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const DRIVER = 181;
const PASSENGER = 182;
const MINUTE = 60_000;
const block = { app: 'admin', ...json({ days: 7 }) };
const driver = { method: 'POST', app: 'driver' };

// A person blocked in the middle of a trip finishes it (owner decision 10.10.2026, docs/158 Ж):
// the trip on the way stays with its seats, its chat and its steps; nothing new is allowed.
describe('a block during a trip on the way', () => {
  it('lets the driver finish the trip, and nothing more', async () => {
    await approvedDriver(DRIVER);
    await registerUser(PASSENGER);
    const input = {
      from: '1726273',
      to: '1718401',
      departAt: Date.now() + 90 * MINUTE,
      seats: 3,
      price: 90_000,
      womanOnBoard: false,
      pickupMode: 'door',
      comment: '',
    };
    const trip = await read<{ id: string }>(call('/driver/trips', DRIVER, { app: 'driver', ...json(input) }));
    const seat = await read<{ id: string }>(
      call(`/trips/${trip.id}/bookings`, PASSENGER, json(doorBooking(1))),
    );
    await call(`/driver/bookings/${seat.id}/confirm`, DRIVER, driver);
    // Half an hour later: «Yoʻlga chiqdim» opens an hour before the time.
    vi.useFakeTimers({ toFake: ['Date'], now: Date.now() + 30 * MINUTE });
    expect((await call(tripDepartPath(trip.id), DRIVER, driver)).status).toBe(200);
    expect((await call(`/admin/users/${await pid(DRIVER)}/block`, OWNER, block)).status).toBe(204);
    // The seat is not cancelled: the car is already on the road.
    const mine = await read<{ bookings: { id: string; status: string }[] }>(
      call('/passenger/bookings', PASSENGER),
    );
    expect(mine.bookings.find((booking) => booking.id === seat.id)?.status).toBe('confirmed');
    // The app opens with the trip and says the person is blocked.
    expect(await read(call('/me', DRIVER, { app: 'driver' }))).toMatchObject({
      state: 'active',
      block: { until: expect.any(Number) },
    });
    // The chat and the steps of the trip work; reading works.
    expect((await call(chatTicketPath(chatKeyOfBooking(seat.id)), DRIVER, driver)).status).toBe(200);
    expect((await call('/driver/trips', DRIVER, { app: 'driver' })).status).toBe(200);
    // Nothing new: no new trip.
    const later = { ...input, departAt: Date.now() + 5 * 60 * MINUTE };
    const again = await call('/driver/trips', DRIVER, { app: 'driver', ...json(later) });
    expect([again.status, await again.json()]).toMatchObject([403, { error: 'users.blocked' }]);
    expect((await call(tripArrivePath(trip.id), DRIVER, driver)).status).toBe(200);
    // The trip is over: the block is the whole app again.
    expect(await read(call('/me', DRIVER, { app: 'driver' }))).toMatchObject({ state: 'blocked' });
  });
});
