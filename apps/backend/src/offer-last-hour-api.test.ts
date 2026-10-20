import { DAY_MS, tashkentDate } from '@platform/contracts';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { fakeTelegram } from './bots/test-bot';
import { approvedDriver, json, read } from './bookings-test-api';
import { call, registerUser, REQUEST_WAY } from './test-api';

vi.stubGlobal('fetch', fakeTelegram().fetch);
afterAll(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const DRIVER = 191;
const PASSENGER = 192;
const PRICE = 90_000;
const MINUTE = 60_000;

// G89 B2: an offer sent in time is taken until its departure; the lead time of a new trip (docs/103)
// is for the driver's own trips, not for the trip a passenger already chose.
describe('an offer in its last hour', () => {
  it('is taken: the trip of the offer opens even inside the lead time', async () => {
    await approvedDriver(DRIVER);
    await registerUser(PASSENGER);
    const date = tashkentDate(Date.now() + DAY_MS);
    const request = await read<{ id: string }>(
      call(
        '/passenger/requests',
        PASSENGER,
        json({ from: '1726273', to: '1718401', date, seats: 1, price: PRICE, ...REQUEST_WAY }),
      ),
    );
    const departAt = Date.parse(`${date}T05:00:00Z`);
    const offer = await read<{ id: string }>(
      call(`/driver/requests/${request.id}/offers`, DRIVER, {
        app: 'driver',
        ...json({ departAt, price: PRICE }),
      }),
    );
    vi.useFakeTimers({ toFake: ['Date'], now: departAt - 30 * MINUTE });
    const taken = await call(`/passenger/offers/${offer.id}/accept`, PASSENGER, { method: 'POST' });
    expect(taken.status).toBe(200);
    expect(await taken.json()).toMatchObject({ status: 'accepted' });
  });
});
