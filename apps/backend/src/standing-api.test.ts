import {
  DAY_MS,
  DRIVER_STANDING_PATH,
  PASSENGER_STANDING_PATH,
  type MeResponse,
  type Standing,
} from '@platform/contracts';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { fakeTelegram } from './bots/test-bot';
import { approvedDriver, json, read } from './bookings-test-api';
import { call, doorBooking, registerUser } from './test-api';

vi.stubGlobal('fetch', fakeTelegram().fetch);
afterAll(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const DRIVER = 91;
const PASSENGERS = [92, 93, 94];
const HOUR = 3_600_000;
const asDriver = { app: 'driver' } as const;
const trip = {
  from: '1726273',
  to: '1718401',
  departAt: Date.now() + 5 * HOUR,
  seats: 3,
  price: 90_000,
  womanOnBoard: false,
  pickupMode: 'door',
  comment: '',
};

describe('the numbers on top of «Profil» of both roles through the API (G65, mockup g65/3)', () => {
  it('counts the trips, the rating and «vaqtida» once the reviews are published', async () => {
    await approvedDriver(DRIVER);
    for (const id of PASSENGERS) await registerUser(id);
    const published = await read<{ id: string }>(
      call('/driver/trips', DRIVER, { ...asDriver, ...json(trip) }),
    );
    const bookings: string[] = [];
    for (const id of PASSENGERS) {
      const asked = await read<{ id: string }>(
        call(`/trips/${published.id}/bookings`, id, json(doorBooking(1))),
      );
      await call(`/driver/bookings/${asked.id}/confirm`, DRIVER, { method: 'POST', ...asDriver });
      bookings.push(asked.id);
    }
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.now() + 20 * HOUR);
    const tags = [['on_time'], ['on_time'], []];
    for (const [index, id] of PASSENGERS.entries()) {
      const review = { bookingId: bookings[index], stars: 5 - index, tags: tags[index], text: '' };
      await call('/reviews', id, json(review));
    }
    expect(await read<Standing>(call(DRIVER_STANDING_PATH, DRIVER, asDriver))).toEqual({
      rating: { average: null, count: 0 },
      onTime: null,
      trips: 1,
    });
    vi.setSystemTime(Date.now() + 8 * DAY_MS);
    expect(await read<Standing>(call(DRIVER_STANDING_PATH, DRIVER, asDriver))).toEqual({
      rating: { average: 4, count: 3 },
      onTime: 67,
      trips: 1,
    });
    const [first = 0] = PASSENGERS;
    expect(await read<Standing>(call(PASSENGER_STANDING_PATH, first))).toEqual({
      rating: { average: null, count: 0 },
      onTime: null,
      trips: 1,
    });
    const me = await read<MeResponse>(call('/me', first));
    expect(me.state === 'active' && me.profile.joinedAt).toBeLessThan(Date.now());
  });
});
