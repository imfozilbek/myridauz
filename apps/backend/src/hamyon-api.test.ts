import { walletOperationPath, type Wallet, type WalletDetail } from '@platform/contracts';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { fakeTelegram } from './bots/test-bot';
import { approvedDriver, json, read } from './bookings-test-api';
import { call, doorBooking, registerUser } from './test-api';

vi.stubGlobal('fetch', fakeTelegram().fetch);
afterAll(() => vi.unstubAllGlobals());

const DRIVER = 71;
const OTHER = 72;
const PASSENGER = 73;
const asDriver = { app: 'driver' } as const;

describe('«Hamyon» of G65 through the API (docs/118 path 8)', () => {
  it('counts the seats left, names the passenger of a commission and opens its details', async () => {
    await approvedDriver(DRIVER);
    await approvedDriver(OTHER);
    await registerUser(PASSENGER);
    const trip = { from: '1726273', to: '1718401', departAt: Date.now() + 5 * 3_600_000, seats: 3 };
    const published = await read<{ id: string }>(
      call('/driver/trips', DRIVER, {
        ...asDriver,
        ...json({ ...trip, price: 90_000, womanOnBoard: false, pickupMode: 'door', comment: '' }),
      }),
    );
    const asked = await read<{ id: string }>(
      call(`/trips/${published.id}/bookings`, PASSENGER, json(doorBooking(2))),
    );
    await read(call(`/driver/bookings/${asked.id}/confirm`, DRIVER, { method: 'POST', ...asDriver }));
    const wallet = await read<Wallet>(call('/driver/wallet', DRIVER, asDriver));
    // 500 000 − 18 000 at 9 000 a seat of the last trip.
    expect(wallet.seatsLeft).toBe(53);
    const [row] = wallet.operations;
    expect(row).toMatchObject({ kind: 'commission', amount: -18_000, passenger: 'Ali', seats: 2 });
    const detail = await read<WalletDetail>(call(walletOperationPath(row?.id ?? ''), DRIVER, asDriver));
    expect(detail).toMatchObject({ kind: 'commission', amount: -18_000, balances: ['bonus'] });
    expect(detail.booking).toMatchObject({ id: asked.id, seats: 2, price: 90_000, commission: 18_000 });
    expect(detail.booking.trip.id).toBe(published.id);
    const other = await call(walletOperationPath(row?.id ?? ''), OTHER, asDriver);
    expect(other.status).toBe(404);
  });
});
