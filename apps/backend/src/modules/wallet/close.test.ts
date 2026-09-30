import { describe, expect, it } from 'vitest';
import { closeWallet } from './application/close';
import type { WalletDeps } from './application/ports';
import { adjust, charge, grantWelcome, walletView } from './application/wallet';
import { createMemoryWallet } from './infrastructure/memory-wallet';
import { idOfPublic, publicIdOf } from '../../test-people';

const DRIVER = 1;
const OWNER = 900;
const PROMO = { amount: 500_000, grants: 3, days: 30, windowDays: 90 };

function setup() {
  let id = 0;
  const deps: WalletDeps = {
    wallet: createMemoryWallet(),
    promo: PROMO,
    people: { find: async (n) => ({ firstName: 'Jasur', publicId: publicIdOf(n) }), idOf: idOfPublic },
    now: () => Date.parse('2026-10-01T05:00:00Z'),
    newId: () => `op-${(id += 1)}`,
  };
  const balances = async () => {
    const { bonus, main } = await walletView(deps, DRIVER);
    return { bonus, main };
  };
  return { deps, balances };
}

describe('a deleted account closes its wallet (docs/12, docs/65 A5)', () => {
  it('brings both balances to zero and gives no new bonus to the same person later', async () => {
    const { deps, balances } = setup();
    await grantWelcome(deps, DRIVER);
    await adjust(deps, OWNER, DRIVER, { balance: 'main', amount: 20_000, reason: 'test' });
    await charge(deps, DRIVER, 'b1', 9_000);
    await closeWallet(deps, DRIVER);
    expect(await balances()).toEqual({ bonus: 0, main: 0 });
    // The same person comes back: the welcome bonus is not given again, a paid trip opens no bonus 2.
    await grantWelcome(deps, DRIVER);
    await adjust(deps, OWNER, DRIVER, { balance: 'main', amount: 10_000, reason: 'test' });
    await charge(deps, DRIVER, 'b2', 9_000);
    expect(await balances()).toEqual({ bonus: 0, main: 1_000 });
  });
});
