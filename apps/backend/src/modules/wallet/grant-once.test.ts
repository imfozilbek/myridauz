import { describe, expect, it } from 'vitest';
import { fullScans, testD1 } from '../../test-d1';
import { grantWelcome } from './application/wallet';
import { grantMissedWelcome } from './application/missed';
import type { WalletDeps, WalletRepository } from './application/ports';
import { d1Wallet } from './infrastructure/d1-wallet';
import { createMemoryWallet } from './infrastructure/memory-wallet';
import { NO_LINKS } from './test-links';

const NOW = Date.parse('2026-10-20T05:00:00Z');
const PROMO = { amount: 500_000, grants: 3, days: 30, windowDays: 90 };

function walletOver(wallet: WalletRepository): WalletDeps {
  let id = 0;
  return {
    wallet,
    promo: PROMO,
    people: { find: async () => undefined, idOf: async () => undefined },
    ...NO_LINKS,
    now: () => NOW,
    newId: () => `op-${(id += 1)}`,
  };
}
const grants = async (deps: WalletDeps) =>
  (await deps.wallet.operations(1)).filter((op) => op.kind === 'bonus_grant').length;

// G89: the approval and the hourly job for a missed bonus in the same moment: bonus 1 comes once,
// in memory and in D1 alike.
describe('a bonus of the promo comes once', () => {
  it('gives bonus 1 once when the approval and the job meet', async () => {
    for (const store of [createMemoryWallet(), d1Wallet(await withoutKeys())]) {
      const deps = walletOver(store);
      // Both read the wallet before either writes: the empty journal of before.
      const empty = await store.operations(1);
      const racing = walletOver({ ...store, operations: async () => empty, withJournal: async () => [] });
      await Promise.all([grantWelcome(racing, 1), grantMissedWelcome(racing, [1])]);
      expect(await grants(deps)).toBe(1);
    }
  });
});

async function withoutKeys() {
  const db = testD1();
  await db.exec('PRAGMA foreign_keys = OFF');
  return db;
}

describe('the grants in D1', () => {
  it('reads each driver by a key', async () => {
    const db = await withoutKeys();
    const deps = walletOver(d1Wallet(db));
    await grantWelcome(deps, 1);
    expect(fullScans(db)).toEqual([]);
  });
});
