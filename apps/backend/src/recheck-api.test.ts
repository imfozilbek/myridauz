import { afterAll, describe, expect, it, vi } from 'vitest';
import { fakeTelegram } from './bots/test-bot';
import { approvedDriver, json, read } from './bookings-test-api';
import { call, registerUser } from './test-api';

vi.stubGlobal('fetch', fakeTelegram().fetch);
afterAll(() => vi.unstubAllGlobals());

const DRIVER = 71;
const PASSENGER = 72;
const jpeg = { body: new Uint8Array(20), headers: { 'content-type': 'image/jpeg' } };
type Booking = { id: string; status: string; plate: string | null; trip: { id: string } };

describe('a new face of an approved driver (docs/05, docs/65 A1)', () => {
  it('keeps the confirmed booking of the passenger, the trip in search, and stops only new trips', async () => {
    await approvedDriver(DRIVER);
    await registerUser(PASSENGER);
    const trip = { from: '1726273', to: '1718401', departAt: Date.now() + 5 * 3_600_000, seats: 3 };
    const input = { ...trip, price: 90_000, womanOnBoard: false, comment: '' };
    const published = await read<{ id: string }>(
      call('/driver/trips', DRIVER, { app: 'driver', ...json(input) }),
    );
    const asked = await read<{ id: string }>(
      call(`/trips/${published.id}/bookings`, PASSENGER, json({ seats: 1 })),
    );
    await call(`/driver/bookings/${asked.id}/confirm`, DRIVER, { method: 'POST', app: 'driver' });
    // The driver retakes the selfie: the application goes to the team's check again.
    expect((await call('/me/avatar', DRIVER, { method: 'PUT', app: 'driver', ...jpeg })).status).toBe(204);
    const mine = await read<{ bookings: Booking[] }>(call('/passenger/bookings', PASSENGER));
    expect(mine.bookings.find((booking) => booking.id === asked.id)).toMatchObject({
      status: 'confirmed',
      plate: '01A123BC',
      trip: { id: published.id },
    });
    expect((await call(`/trips/${published.id}`, PASSENGER)).status).toBe(200);
    const driverSide = await read<{ bookings: Booking[] }>(
      call('/driver/bookings', DRIVER, { app: 'driver' }),
    );
    expect(driverSide.bookings.map((booking) => booking.id)).toContain(asked.id);
    const again = await call('/driver/trips', DRIVER, {
      app: 'driver',
      ...json({ ...input, departAt: trip.departAt + 3_600_000 }),
    });
    expect(again.status).toBe(403);
  });
});
