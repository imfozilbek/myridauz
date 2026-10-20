import { driverMeetPath } from '@platform/contracts';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { fakeTelegram } from './bots/test-bot';
import { approvedDriver, json, read } from './bookings-test-api';
import { call, doorBooking, registerUser } from './test-api';

const telegram = fakeTelegram();
vi.stubGlobal('fetch', telegram.fetch);
afterAll(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const DRIVER = 893;
const PASSENGER = 894;
const HOUR = 3_600_000;
const MINUTE = 60_000;
// 09:00 in Tashkent: the trip stays inside the day of the bots (lesson 204).
const MORNING = Date.parse('2026-10-09T04:00:00Z');
const asDriver = { method: 'POST', app: 'driver' } as const;

// G89 C7 (owner decision 20.10.2026): the driver marked «Kelmadi» at the point. The passenger is not
// on the trip (docs/129), so the mother who follows her never reads «Yoʻlda»: the link closes, the
// follow screen says «Bu safar endi koʻrinmaydi» (docs/43).
describe('close people of a passenger marked «Kelmadi»', () => {
  it('lose the link at once', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(MORNING);
    await approvedDriver(DRIVER);
    await registerUser(PASSENGER);
    const departAt = Date.now() + 5 * HOUR;
    const way = { from: '1726273', to: '1718401', departAt, seats: 2, price: 90_000 };
    const trip = await read<{ id: string }>(
      call('/driver/trips', DRIVER, {
        app: 'driver',
        ...json({ ...way, womanOnBoard: false, pickupMode: 'door', comment: '' }),
      }),
    );
    const seat = await read<{ id: string }>(
      call(`/trips/${trip.id}/bookings`, PASSENGER, json(doorBooking(1))),
    );
    await call(`/driver/bookings/${seat.id}/confirm`, DRIVER, asDriver);
    const link = await read<{ link: string }>(
      call(`/passenger/bookings/${seat.id}/share`, PASSENGER, json({})),
    );
    const token = link.link.split('follow_')[1] ?? '';
    expect((await call(`/shared/${token}`, 0)).status).toBe(200);
    vi.setSystemTime(departAt - 10 * MINUTE);
    // «Kelmadi» comes after «Men keldim» at the point (G89 B16).
    await call(driverMeetPath(seat.id, 'came'), DRIVER, asDriver);
    expect((await call(driverMeetPath(seat.id, 'no_show'), DRIVER, asDriver)).status).toBe(200);
    vi.setSystemTime(departAt + 30 * MINUTE);
    const shared = await call(`/shared/${token}`, 0);
    expect([shared.status, await shared.json()]).toEqual([404, { error: 'shares.not_found' }]);
  });
});
