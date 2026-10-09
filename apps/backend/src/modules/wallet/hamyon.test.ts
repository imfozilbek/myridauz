import type { Booking } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import type { WalletDeps } from './application/ports';
import { refundNoShow } from './application/no-show-refund';
import { adjust, charge, refund } from './application/wallet';
import { walletDetail } from './application/wallet-detail';
import { walletView } from './application/wallet-view';
import { createMemoryWallet } from './infrastructure/memory-wallet';
import { idOfPublic, publicIdOf } from '../../test-people';
import { NO_LINKS } from './test-links';

const DRIVER = 1;
const OTHER = 2;
const OWNER = 900;
const SARDOR = { id: 'b1', seats: 2, price: 90_000, commission: 18_000 } as Booking;

function setup(lastPrice: number | null = 90_000) {
  let id = 0;
  const deps: WalletDeps = {
    wallet: createMemoryWallet(),
    promo: { amount: 500_000, grants: 3, days: 30, windowDays: 90 },
    people: { find: async (n) => ({ firstName: 'Murod', publicId: publicIdOf(n) }), idOf: idOfPublic },
    ...NO_LINKS,
    bookings: async (ids) => new Map(ids.map((bookingId) => [bookingId, { passenger: 'Sardor', seats: 2 }])),
    booking: async (bookingId) => (bookingId === 'b1' ? SARDOR : undefined),
    lastPrice: async () => lastPrice,
    now: () => Date.parse('2026-10-07T09:32:00Z'),
    newId: () => `op-${(id += 1)}`,
  };
  const give = (balance: 'bonus' | 'main', amount: number, driver = DRIVER) =>
    adjust(deps, OWNER, driver, { balance, amount, reason: 'test' });
  return { deps, give };
}

describe('«Hamyon» of G65 (docs/118 path 8, mockups g65/1 and g65/2)', () => {
  it('counts the seats the money still confirms at the price of the last trip: ≈ 52 joy', async () => {
    const { deps, give } = setup();
    await give('bonus', 473_000);
    expect((await walletView(deps, DRIVER)).seatsLeft).toBe(52);
  });

  it('no money confirms no seat even before a trip; money before the first trip says nothing', async () => {
    const empty = setup(null);
    expect((await walletView(empty.deps, DRIVER)).seatsLeft).toBe(0);
    await empty.give('main', 50_000);
    expect((await walletView(empty.deps, DRIVER)).seatsLeft).toBeNull();
  });

  it('a commission row names the passenger and the seats of its booking', async () => {
    const { deps, give } = setup();
    await give('bonus', 100_000);
    await charge(deps, DRIVER, 'b1', 18_000);
    const [row] = (await walletView(deps, DRIVER)).operations;
    expect(row).toMatchObject({ kind: 'commission', amount: -18_000, passenger: 'Sardor', seats: 2 });
  });

  it('the details of a commission: one sum over both balances, and the booking behind it', async () => {
    const { deps, give } = setup();
    await give('bonus', 10_000);
    await give('main', 50_000);
    await charge(deps, DRIVER, 'b1', 18_000);
    const [row] = (await walletView(deps, DRIVER)).operations;
    expect(await walletDetail(deps, DRIVER, row?.id ?? '')).toMatchObject({
      kind: 'commission',
      amount: -18_000,
      balances: ['bonus', 'main'],
      booking: SARDOR,
    });
  });

  it('the refund «Qaytarildi» opens too, with the sum that came back', async () => {
    const { deps, give } = setup();
    await give('bonus', 100_000);
    await charge(deps, DRIVER, 'b1', 18_000);
    await refund(deps, DRIVER, 'b1');
    const [row] = (await walletView(deps, DRIVER)).operations;
    expect(await walletDetail(deps, DRIVER, row?.id ?? '')).toMatchObject({ kind: 'refund', amount: 18_000 });
  });

  it('the refund of a no-show the owner confirmed opens as «Qaytarildi» too (G63, G65)', async () => {
    const { deps, give } = setup();
    await give('main', 100_000);
    await charge(deps, DRIVER, 'b1', 18_000);
    await refundNoShow(deps, OWNER, DRIVER, 'b1');
    const [row] = (await walletView(deps, DRIVER)).operations;
    expect(await walletDetail(deps, DRIVER, row?.id ?? '')).toMatchObject({ kind: 'refund', amount: 18_000 });
  });

  it('opens nothing for another driver, a bonus row or a missing booking', async () => {
    const { deps, give } = setup();
    await give('bonus', 100_000);
    await charge(deps, DRIVER, 'b1', 18_000);
    await give('bonus', 100_000, OTHER);
    await charge(deps, OTHER, 'b9', 9_000);
    const [commission, bonus] = (await walletView(deps, DRIVER)).operations;
    const [other] = (await walletView(deps, OTHER)).operations;
    expect(await walletDetail(deps, OTHER, commission?.id ?? '')).toBeNull();
    expect(await walletDetail(deps, DRIVER, bonus?.id ?? '')).toBeNull();
    expect(await walletDetail(deps, OTHER, other?.id ?? '')).toBeNull();
  });
});
