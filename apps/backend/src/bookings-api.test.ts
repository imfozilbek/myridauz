import { afterAll, describe, expect, it, vi } from 'vitest';
import { fakeTelegram } from './bots/test-bot';
import { approvedDriver, json, OWNER, read, seen } from './bookings-test-api';
import { call, pid, registerUser, doorBooking } from './test-api';

vi.stubGlobal('fetch', fakeTelegram().fetch);
afterAll(() => vi.unstubAllGlobals());

const DRIVER = 61;
const PASSENGER = 62;

describe('bookings and the wallet API (docs/12, docs/35)', () => {
  it('books, confirms with the bonus and never shows a contact', async () => {
    await approvedDriver(DRIVER);
    await registerUser(PASSENGER);
    const wallet = await read<{ bonus: number }>(call('/driver/wallet', DRIVER, { app: 'driver' }));
    expect(wallet.bonus).toBe(500_000);
    const trip = {
      from: '1726273',
      to: '1718401',
      departAt: Date.now() + 5 * 3_600_000,
      seats: 3,
      price: 90_000,
    };
    const published = await read<{ id: string }>(
      call('/driver/trips', DRIVER, {
        app: 'driver',
        ...json({ ...trip, womanOnBoard: false, pickupMode: 'door', comment: '' }),
      }),
    );
    const asked = await read<{ id: string; status: string }>(
      call(`/trips/${published.id}/bookings`, PASSENGER, json(doorBooking(1))),
    );
    expect(asked.status).toBe('requested');
    const confirmed = await call(`/driver/bookings/${asked.id}/confirm`, DRIVER, {
      method: 'POST',
      app: 'driver',
    });
    expect(confirmed.status).toBe(200);
    await read(Promise.resolve(confirmed));
    await read(call('/passenger/bookings', PASSENGER));
    await read(call('/driver/bookings', DRIVER, { app: 'driver' }));
    await read(call(`/admin/trips/${published.id}/bookings`, OWNER, { app: 'admin' }));
    await read(call('/admin/wallets', OWNER, { app: 'admin' }));
    const after = await read<{ bonus: number }>(call('/driver/wallet', DRIVER, { app: 'driver' }));
    expect(after.bonus).toBe(491_000);
    for (const text of seen) {
      expect(text).not.toContain(`99890${DRIVER}`);
      expect(text).not.toContain(`99890${PASSENGER}`);
      expect(text.toLowerCase()).not.toMatch(/"(phone|username)"/);
    }
  });

  it('cancels the bookings when the driver cancels the trip, with a refund', async () => {
    const trip = {
      from: '1726273',
      to: '1718401',
      // Two days after the first trip: the trips of one driver cannot overlap (docs/103).
      departAt: Date.now() + 53 * 3_600_000,
      seats: 2,
      price: 90_000,
    };
    const published = await read<{ id: string }>(
      call('/driver/trips', DRIVER, {
        app: 'driver',
        ...json({ ...trip, womanOnBoard: false, pickupMode: 'door', comment: '' }),
      }),
    );
    const asked = await read<{ id: string }>(
      call(`/trips/${published.id}/bookings`, PASSENGER, json(doorBooking(2))),
    );
    await call(`/driver/bookings/${asked.id}/confirm`, DRIVER, { method: 'POST', app: 'driver' });
    const before = await read<{ bonus: number }>(call('/driver/wallet', DRIVER, { app: 'driver' }));
    await call(`/driver/trips/${published.id}/cancel`, DRIVER, { method: 'POST', app: 'driver' });
    const mine = await read<{ bookings: { id: string; status: string }[] }>(
      call('/passenger/bookings', PASSENGER),
    );
    expect(mine.bookings.find((booking) => booking.id === asked.id)?.status).toBe('cancelled_by_driver');
    // Two seats at 90 000: 2 × 9 000 goes back to the bonus (owner decision 29.09.2026).
    expect((await read<{ bonus: number }>(call('/driver/wallet', DRIVER, { app: 'driver' }))).bonus).toBe(
      before.bonus + 18_000,
    );
  });

  it('lets only an owner correct a wallet, with a reason', async () => {
    const adjust = `/admin/wallets/${await pid(DRIVER)}/adjust`;
    const body = { balance: 'main', amount: 50_000, reason: 'Kelmadi, qaytarildi' };
    expect((await call(adjust, PASSENGER, { app: 'admin', ...json(body) })).status).toBe(403);
    expect((await call(adjust, OWNER, { app: 'admin', ...json({ ...body, reason: '' }) })).status).toBe(400);
    const corrected = await read<{ main: number }>(call(adjust, OWNER, { app: 'admin', ...json(body) }));
    expect(corrected.main).toBe(50_000);
  });
});
