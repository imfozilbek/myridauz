import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { app } from './app';
import { approvedDriver, json, read } from './bookings-test-api';
import { call, doorBooking, initData, registerUser, testEnv } from './test-api';

vi.stubGlobal('fetch', async () => Response.json({ ok: true, result: { message_id: 1 } }));
afterAll(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const { t } = createI18n(DEFAULT_LOCALE);
const DRIVER = 895;
const PASSENGER = 896;
const HOUR = 3_600_000;
const chats = { idFromName: (name: string) => name, get: () => ({ fetch: async () => new Response(null) }) };

async function deleteDriver() {
  const headers = {
    authorization: `tma ${await initData(DRIVER, testEnv.DRIVER_BOT_TOKEN)}`,
    'x-mini-app': 'driver',
  };
  return app.request('/me', { method: 'DELETE', headers }, { ...testEnv, CHATS: chats });
}

type Seat = { id: string; trip: { driver: { firstName: string } } };

// G89 M9 (owner decision 20.10.2026): a driver deleted the account after a bad ride. The ride stays
// for the passenger with «Hisob oʻchirilgan» for the name, and the complaint of 7 days still goes
// (docs/129).
describe('a ride whose driver deleted the account', () => {
  it('stays in the passenger rides and takes a complaint', async () => {
    await approvedDriver(DRIVER);
    await registerUser(PASSENGER);
    const way = { from: '1726273', to: '1718401', departAt: Date.now() + 5 * HOUR, seats: 2, price: 90_000 };
    const trip = await read<{ id: string }>(
      call('/driver/trips', DRIVER, {
        app: 'driver',
        ...json({ ...way, womanOnBoard: false, pickupMode: 'door', comment: '' }),
      }),
    );
    const seat = await read<{ id: string }>(
      call(`/trips/${trip.id}/bookings`, PASSENGER, json(doorBooking(1))),
    );
    await call(`/driver/bookings/${seat.id}/confirm`, DRIVER, { method: 'POST', app: 'driver' });
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.now() + 20 * HOUR);
    expect((await deleteDriver()).status).toBe(204);
    const mine = await read<{ bookings: Seat[] }>(call('/passenger/bookings', PASSENGER));
    const ride = mine.bookings.find((booking) => booking.id === seat.id);
    expect(ride?.trip.driver.firstName).toBe(t('account.gone'));
    const filed = await call('/complaints', PASSENGER, json({ bookingId: seat.id, reasons: ['harassment'] }));
    expect(filed.status).toBe(201);
  });
});
