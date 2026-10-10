import { describe, expect, it } from 'vitest';
import { approvedDriver, json, read } from './bookings-test-api';
import { call } from './test-api';

const DRIVER = 81;
const HOUR = 3_600_000;
const jpeg = { body: new Uint8Array(20), headers: { 'content-type': 'image/jpeg' } };
const photo = () =>
  call('/driver/application/photos/side', DRIVER, { method: 'PUT', app: 'driver', ...jpeg });

// One car at the launch (G75, docs/124 Ё): a live trip keeps the car, it is over: the car changes.
describe('a new car of an approved driver', () => {
  it('waits for the live trip to be over', async () => {
    await approvedDriver(DRIVER);
    const trip = await read<{ id: string }>(
      call('/driver/trips', DRIVER, {
        app: 'driver',
        ...json({
          from: '1726273',
          to: '1718401',
          departAt: Date.now() + 5 * HOUR,
          seats: 3,
          price: 90_000,
          womanOnBoard: false,
          pickupMode: 'door',
          comment: '',
        }),
      }),
    );
    const locked = await photo();
    expect(locked.status).toBe(409);
    expect(await locked.json()).toEqual({ error: 'drivers.live_trips' });
    await call(`/driver/trips/${trip.id}/cancel`, DRIVER, { method: 'POST', app: 'driver' });
    expect((await photo()).status).toBe(200);
  });
});
