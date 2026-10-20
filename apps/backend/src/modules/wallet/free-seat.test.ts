import { describe, expect, it } from 'vitest';
import { testD1 } from '../../test-d1';
import { charge, refund } from './application/wallet';
import type { WalletDeps } from './application/ports';
import { d1Wallet } from './infrastructure/d1-wallet';
import { NO_LINKS } from './test-links';

// G89: the owner may set the commission to 0 in «Cheklovlar» (a free time, docs/12): a seat is then
// confirmed with nothing written, and its cancel gives nothing back.
describe('a seat without a commission', () => {
  it('confirms and cancels with no row in the wallet', async () => {
    const db = testD1();
    await db.exec('PRAGMA foreign_keys = OFF');
    const deps: WalletDeps = {
      wallet: d1Wallet(db),
      promo: { amount: 500_000, grants: 3, days: 30, windowDays: 90 },
      people: { find: async () => undefined, idOf: async () => undefined },
      ...NO_LINKS,
      now: () => 1,
      newId: () => 'op-1',
    };
    let batches = 0;
    const counted = {
      ...deps,
      wallet: { ...deps.wallet, append: async (rows: never[]) => ((batches += 1), deps.wallet.append(rows)) },
    };
    expect(await charge(counted, 1, 'b1', 0)).toBe('ok');
    await refund(counted, 1, 'b1');
    expect(batches).toBe(0);
    expect(await deps.wallet.operations(1)).toEqual([]);
  });
});
