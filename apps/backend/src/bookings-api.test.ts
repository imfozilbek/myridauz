import type { Location } from '@platform/contracts';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { fakeTelegram } from './bots/test-bot';
import { localLocations } from './modules/locations';
import { call, registerUser } from './test-api';

vi.stubGlobal('fetch', fakeTelegram().fetch);
afterAll(() => vi.unstubAllGlobals());

const place = (id: string, parentId: string | null, oneCity = false): Location => ({
  id,
  parentId,
  type: parentId ? 'city' : 'region',
  name: id,
  lat: 41,
  lng: 69,
  oneCity,
});
localLocations.load([place('1726', null, true), place('1726273', '1726'), place('1718', null), place('1718401', '1718')]);
await localLocations.saveDistance('1718401', '1726273', 300, 0);

const DRIVER = 61;
const PASSENGER = 62;
const OWNER = 900;
const jpeg = { body: new Uint8Array(20), headers: { 'content-type': 'image/jpeg' } };
const json = (body: unknown, method = 'POST') => ({
  method,
  body: JSON.stringify(body),
  headers: { 'content-type': 'application/json' },
});
// Every answer of the API is read here: a phone or a username must never be in one (docs/07).
const seen: string[] = [];
async function read<T>(response: Promise<Response>): Promise<T> {
  const text = await (await response).text();
  seen.push(text);
  return JSON.parse(text) as T;
}

async function approvedDriver(id: number) {
  await registerUser(id);
  await call('/me/avatar', id, { method: 'PUT', ...jpeg });
  for (const kind of ['front', 'side', 'interior'])
    await call(`/driver/application/photos/${kind}`, id, { method: 'PUT', app: 'driver', ...jpeg });
  const car = { make: 'Chevrolet', model: 'Cobalt', color: 'white', plate: '01 A 123 BC', seats: 4 };
  await call('/driver/application', id, { app: 'driver', ...json(car) });
  await call(`/admin/applications/${id}/decision`, OWNER, { app: 'admin', ...json({ action: 'approve' }) });
}

describe('bookings and the wallet API (docs/12, docs/35)', () => {
  it('books, confirms with the bonus and never shows a contact', async () => {
    await approvedDriver(DRIVER);
    await registerUser(PASSENGER);
    const wallet = await read<{ bonus: number }>(call('/driver/wallet', DRIVER, { app: 'driver' }));
    expect(wallet.bonus).toBe(500_000);
    const trip = { from: '1726273', to: '1718401', departAt: Date.now() + 5 * 3_600_000, seats: 3, price: 90_000 };
    const published = await read<{ id: string }>(
      call('/driver/trips', DRIVER, { app: 'driver', ...json({ ...trip, womanOnBoard: false, comment: '' }) }),
    );
    const asked = await read<{ id: string; status: string }>(
      call(`/trips/${published.id}/bookings`, PASSENGER, json({ seats: 1 })),
    );
    expect(asked.status).toBe('requested');
    const confirmed = await call(`/driver/bookings/${asked.id}/confirm`, DRIVER, { method: 'POST', app: 'driver' });
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

  it('cancels the bookings when the driver cancels the trip, without a refund', async () => {
    const trip = { from: '1726273', to: '1718401', departAt: Date.now() + 6 * 3_600_000, seats: 2, price: 90_000 };
    const published = await read<{ id: string }>(
      call('/driver/trips', DRIVER, { app: 'driver', ...json({ ...trip, womanOnBoard: false, comment: '' }) }),
    );
    const asked = await read<{ id: string }>(call(`/trips/${published.id}/bookings`, PASSENGER, json({ seats: 2 })));
    await call(`/driver/bookings/${asked.id}/confirm`, DRIVER, { method: 'POST', app: 'driver' });
    const before = await read<{ bonus: number }>(call('/driver/wallet', DRIVER, { app: 'driver' }));
    await call(`/driver/trips/${published.id}/cancel`, DRIVER, { method: 'POST', app: 'driver' });
    const mine = await read<{ bookings: { id: string; status: string }[] }>(call('/passenger/bookings', PASSENGER));
    expect(mine.bookings.find((booking) => booking.id === asked.id)?.status).toBe('cancelled_by_driver');
    expect((await read<{ bonus: number }>(call('/driver/wallet', DRIVER, { app: 'driver' }))).bonus).toBe(before.bonus);
  });

  it('lets only an owner correct a wallet, with a reason', async () => {
    const adjust = `/admin/wallets/${DRIVER}/adjust`;
    const body = { balance: 'main', amount: 50_000, reason: 'Kelmadi, qaytarildi' };
    expect((await call(adjust, PASSENGER, { app: 'admin', ...json(body) })).status).toBe(403);
    expect((await call(adjust, OWNER, { app: 'admin', ...json({ ...body, reason: '' }) })).status).toBe(400);
    const corrected = await read<{ main: number }>(call(adjust, OWNER, { app: 'admin', ...json(body) }));
    expect(corrected.main).toBe(50_000);
  });
});
