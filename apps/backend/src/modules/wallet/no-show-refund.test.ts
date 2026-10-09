import { NO_SHOW_REASON } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { refundNoShow } from './application/no-show-refund';
import type { WalletDeps } from './application/ports';
import { adjust, charge, refund } from './application/wallet';
import { walletView } from './application/wallet-view';
import { createMemoryWallet } from './infrastructure/memory-wallet';
import { idOfPublic, publicIdOf } from '../../test-people';
import { NO_LINKS } from './test-links';

const DRIVER = 1;
const OWNER = 900;

function setup() {
  let id = 0;
  const deps: WalletDeps = {
    wallet: createMemoryWallet(),
    promo: { amount: 500_000, grants: 3, days: 30, windowDays: 90 },
    people: { find: async (n) => ({ firstName: 'Jasur', publicId: publicIdOf(n) }), idOf: idOfPublic },
    ...NO_LINKS,
    bookings: async (ids) => new Map(ids.map((id) => [id, { passenger: 'Akmal', seats: 1 }])),
    now: () => Date.parse('2026-10-01T05:00:00Z'),
    newId: () => `op-${(id += 1)}`,
  };
  const balances = async () => {
    const { bonus, main } = await walletView(deps, DRIVER);
    return { bonus, main };
  };
  return { deps, balances };
}

describe('the refund of a no-show after the owner confirms it (docs/35, G63)', () => {
  it('gives the commission of the booking back once, linked to it, back where it came from', async () => {
    const { deps, balances } = setup();
    await adjust(deps, OWNER, DRIVER, { balance: 'bonus', amount: 5000, reason: 'bonus' });
    await adjust(deps, OWNER, DRIVER, { balance: 'main', amount: 10_000, reason: 'main' });
    await charge(deps, DRIVER, 'b1', 9000);
    const twice = await Promise.all([
      refundNoShow(deps, OWNER, DRIVER, 'b1'),
      refundNoShow(deps, OWNER, DRIVER, 'b1'),
    ]);
    expect(twice.sort()).toEqual(['nothing', 'ok']);
    expect(await refundNoShow(deps, OWNER, DRIVER, 'b1')).toBe('nothing');
    expect(await balances()).toEqual({ bonus: 5000, main: 10_000 });
  });

  it('«Hamyon» names the passenger who did not come on the refund row', async () => {
    const { deps } = setup();
    await adjust(deps, OWNER, DRIVER, { balance: 'main', amount: 20_000, reason: 'main' });
    await charge(deps, DRIVER, 'b1', 9000);
    await refundNoShow(deps, OWNER, DRIVER, 'b1');
    const [row, commission] = (await walletView(deps, DRIVER)).operations;
    expect(row).toMatchObject({
      kind: 'admin_adjustment',
      balance: 'main',
      amount: 9000,
      bookingId: 'b1',
      reason: NO_SHOW_REASON,
      passenger: 'Akmal',
    });
    // G65: every row of a booking names its passenger and seats (mockup g65/1).
    expect(commission).toMatchObject({ kind: 'commission', passenger: 'Akmal', seats: 1 });
  });

  it('a cancel after the refund of a no-show gives nothing more (docs/35)', async () => {
    const { deps, balances } = setup();
    await adjust(deps, OWNER, DRIVER, { balance: 'main', amount: 20_000, reason: 'main' });
    await charge(deps, DRIVER, 'b1', 9000);
    expect(await refundNoShow(deps, OWNER, DRIVER, 'b1')).toBe('ok');
    await refund(deps, DRIVER, 'b1');
    expect(await balances()).toEqual({ bonus: 0, main: 20_000 });
  });

  it('gives nothing for a booking the cancel refunded already or never charged', async () => {
    const { deps, balances } = setup();
    await adjust(deps, OWNER, DRIVER, { balance: 'main', amount: 20_000, reason: 'main' });
    await charge(deps, DRIVER, 'b1', 9000);
    await refund(deps, DRIVER, 'b1');
    expect(await refundNoShow(deps, OWNER, DRIVER, 'b1')).toBe('nothing');
    expect(await refundNoShow(deps, OWNER, DRIVER, 'b2')).toBe('nothing');
    expect(await balances()).toEqual({ bonus: 0, main: 20_000 });
  });
});
