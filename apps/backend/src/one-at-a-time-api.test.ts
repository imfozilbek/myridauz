import { DAY_MS, tashkentDate } from '@platform/contracts';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { fakeTelegram } from './bots/test-bot';
import { approvedDriver, json, read } from './bookings-test-api';
import { call, doorBooking, registerUser, REQUEST_WAY } from './test-api';

vi.stubGlobal('fetch', fakeTelegram().fetch);
afterAll(() => vi.unstubAllGlobals());

const DRIVER = 211;
const PASSENGER = 212;
const PRICE = 90_000;
const asDriver = { app: 'driver' } as const;
const trip = (departAt: number) => ({
  from: '1726273',
  to: '1718401',
  departAt,
  seats: 3,
  price: PRICE,
  womanOnBoard: false,
  pickupMode: 'door',
  comment: '',
});
const request = () => ({
  from: '1726273',
  to: '1718401',
  date: tashkentDate(Date.now() + DAY_MS),
  seats: 1,
  price: PRICE,
  ...REQUEST_WAY,
});

// One at a time (owner decision 12.10.2026, docs/172): a driver has one live trip, a passenger an
// open request or a seat.
describe('one at a time (docs/172)', () => {
  it('a driver has one live trip', async () => {
    await approvedDriver(DRIVER);
    const first = await call('/driver/trips', DRIVER, {
      ...asDriver,
      ...json(trip(Date.now() + 5 * 3_600_000)),
    });
    expect(first.status).toBe(201);
    const second = await call('/driver/trips', DRIVER, {
      ...asDriver,
      ...json(trip(Date.now() + 3 * DAY_MS)),
    });
    expect([second.status, await second.json()]).toEqual([409, { error: 'trips.too_many' }]);
  });

  it('a seat asked closes the open request, and a seat leaves no new request', async () => {
    await registerUser(PASSENGER);
    const asked = await read<{ id: string }>(call('/passenger/requests', PASSENGER, json(request())));
    const [published] = (await read<{ trips: { id: string }[] }>(call('/driver/trips', DRIVER, asDriver)))
      .trips;
    const seat = await call(`/trips/${published?.id}/bookings`, PASSENGER, json(doorBooking(1)));
    expect(seat.status).toBe(201);
    const mine = await read<{ requests: { id: string; status: string }[] }>(
      call('/passenger/requests', PASSENGER),
    );
    expect(mine.requests.find((item) => item.id === asked.id)?.status).toBe('cancelled');
    const again = await call('/passenger/requests', PASSENGER, json(request()));
    // The passenger hears her own reason: the seat (G91 PAS-2).
    expect([again.status, await again.json()]).toEqual([409, { error: 'bookings.has_seat' }]);
  });
});
