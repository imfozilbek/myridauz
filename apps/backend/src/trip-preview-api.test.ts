import { describe, expect, it } from 'vitest';
import { approvedDriver, json, read } from './bookings-test-api';
import { call } from './test-api';

const DRIVER = 61;
const NEWCOMER = 62;
const HOUR = 3_600_000;

// A new person from a channel post sees the trip before the registration (G75, docs/124 Д).
describe('a trip for a person not registered yet', () => {
  it('opens by its id', async () => {
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
    const seen = await call(`/trips/${trip.id}`, NEWCOMER);
    expect(seen.status).toBe(200);
    expect(await seen.json()).toMatchObject({ id: trip.id });
  });
});
