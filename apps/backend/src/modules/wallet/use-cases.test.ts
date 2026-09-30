import { describe, expect, it } from 'vitest';
import {
  adjust,
  burnExpired,
  canAfford,
  charge,
  grantWelcome,
  refund,
  walletView,
} from './application/wallet';
import { grantMissedWelcome } from './application/missed';
import type { WalletDeps } from './application/ports';
import { createMemoryWallet } from './infrastructure/memory-wallet';
import { idOfPublic, publicIdOf } from '../../test-people';

const DAY = 24 * 60 * 60 * 1000;
const START = Date.parse('2026-10-01T05:00:00Z');
const PROMO = { amount: 500_000, grants: 3, days: 30, windowDays: 90 };

function setup(promo = PROMO) {
  let now = START;
  let id = 0;
  const deps: WalletDeps = {
    wallet: createMemoryWallet(),
    promo,
    people: { find: async (id) => ({ firstName: 'Jasur', publicId: publicIdOf(id) }), idOf: idOfPublic },
    now: () => now,
    newId: () => `op-${(id += 1)}`,
  };
  const later = (days: number) => void (now += days * DAY);
  const balances = async () => {
    const { bonus, main } = await walletView(deps, 1);
    return { bonus, main };
  };
  return { deps, later, balances };
}

describe('the wallet of a driver (docs/12)', () => {
  it('gives bonus 1 to a driver approved before wallets existed, only once', async () => {
    const { deps, balances } = setup();
    await grantWelcome(deps, 2);
    await grantMissedWelcome(deps, [1, 2]);
    await grantMissedWelcome(deps, [1, 2]);
    expect(await balances()).toEqual({ bonus: 500_000, main: 0 });
    expect((await walletView(deps, 2)).bonus).toBe(500_000);
  });

  it('gives bonus 1 once at the approval and spends the bonus first', async () => {
    const { deps, balances } = setup();
    await grantWelcome(deps, 1);
    await grantWelcome(deps, 1);
    expect(await balances()).toEqual({ bonus: 500_000, main: 0 });
    await adjust(deps, 900, 1, { balance: 'main', amount: 20_000, reason: 'test' });
    expect(await charge(deps, 1, 'b1', 9000)).toBe('ok');
    expect(await balances()).toEqual({ bonus: 491_000, main: 20_000 });
  });

  it('never takes the same commission twice and refuses without money', async () => {
    const { deps, balances } = setup();
    await adjust(deps, 900, 1, { balance: 'main', amount: 10_000, reason: 'test' });
    const [first, second] = await Promise.all([charge(deps, 1, 'b1', 9000), charge(deps, 1, 'b1', 9000)]);
    expect([first, second].sort()).toEqual(['duplicate', 'ok']);
    expect(await balances()).toEqual({ bonus: 0, main: 1000 });
    expect(await canAfford(deps, 1, 3000)).toBe(false);
    expect(await charge(deps, 1, 'b2', 3000)).toBe('not_enough');
  });

  it('refunds to the balances the commission came from, once', async () => {
    const { deps, balances } = setup();
    await adjust(deps, 900, 1, { balance: 'bonus', amount: 5000, reason: 'bonus' });
    await adjust(deps, 900, 1, { balance: 'main', amount: 10_000, reason: 'main' });
    await charge(deps, 1, 'b1', 9000);
    expect(await balances()).toEqual({ bonus: 0, main: 6000 });
    await refund(deps, 1, 'b1');
    await refund(deps, 1, 'b1');
    expect(await balances()).toEqual({ bonus: 5000, main: 10_000 });
  });

  it('gives the next bonus at once when the previous is spent, up to 3 within 90 days', async () => {
    const { deps, later, balances } = setup();
    await grantWelcome(deps, 1);
    later(10);
    await charge(deps, 1, 'b1', 500_000);
    expect(await balances()).toEqual({ bonus: 500_000, main: 0 });
    later(10);
    await charge(deps, 1, 'b2', 500_000);
    later(10);
    await charge(deps, 1, 'b3', 500_000);
    // Three bonuses are all there is.
    expect(await balances()).toEqual({ bonus: 0, main: 0 });
  });

  it('burns a bonus not spent in 30 days and gives no next one', async () => {
    const { deps, later, balances } = setup();
    await grantWelcome(deps, 1);
    await charge(deps, 1, 'b1', 100_000);
    later(29);
    await burnExpired(deps);
    expect((await balances()).bonus).toBe(400_000);
    later(1);
    await burnExpired(deps);
    expect(await balances()).toEqual({ bonus: 0, main: 0 });
    // A refund to a burnt bonus burns with the next run.
    await refund(deps, 1, 'b1');
    await burnExpired(deps);
    expect((await balances()).bonus).toBe(0);
    const view = await walletView(deps, 1);
    expect(view.operations.map((op) => op.kind)).toContain('bonus_expired');
  });

  it('gives no bonus after the window, and an old bonus is not money', async () => {
    const { deps, later, balances } = setup({ ...PROMO, windowDays: 20 });
    await grantWelcome(deps, 1);
    later(25);
    await charge(deps, 1, 'b1', 500_000);
    expect(await balances()).toEqual({ bonus: 0, main: 0 });
    await refund(deps, 1, 'b1');
    later(10);
    // The refund went to a bonus that is over: before the Cron job burns it, it pays nothing.
    expect(await canAfford(deps, 1, 3000)).toBe(false);
    expect(await charge(deps, 1, 'b2', 3000)).toBe('not_enough');
  });

  it('lets an owner correct a balance with a reason, never below zero', async () => {
    const { deps } = setup();
    expect(await adjust(deps, 900, 1, { balance: 'main', amount: -1, reason: 'test' })).toBe('not_enough');
    await adjust(deps, 900, 1, { balance: 'main', amount: 50_000, reason: 'Kelmadi, qaytarildi' });
    const view = await walletView(deps, 1);
    expect(view.operations[0]).toMatchObject({ kind: 'admin_adjustment', reason: 'Kelmadi, qaytarildi' });
  });
});
