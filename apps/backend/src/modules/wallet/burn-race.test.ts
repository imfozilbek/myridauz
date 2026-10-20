import { describe, expect, it } from 'vitest';
import { adjust, charge, grantWelcome } from './application/wallet';
import { walletView } from './application/wallet-view';
import type { WalletDeps } from './application/ports';
import { createMemoryWallet } from './infrastructure/memory-wallet';
import { NO_LINKS } from './test-links';

const START = Date.parse('2026-10-01T05:00:00Z');
const PROMO = { amount: 500_000, grants: 3, days: 30, windowDays: 90 };

// G89 M15: the Cron burns the bonus between the read of a charge and its write. The main money
// still covers the commission: the driver does not hear «not enough» for nothing.
describe('a bonus that burns in the moment of a charge', () => {
  it('takes the commission from the main money', async () => {
    const store = createMemoryWallet();
    let now = START;
    let burnt = false;
    const deps: WalletDeps = {
      wallet: store,
      promo: PROMO,
      people: { find: async () => undefined, idOf: async () => undefined },
      ...NO_LINKS,
      now: () => now,
      newId: () => `op-${Math.random()}`,
    };
    const grant = await grantWelcome(deps, 1);
    await adjust(deps, 900, 1, { balance: 'main', amount: 20_000, reason: 'test' });
    now = (grant?.expiresAt ?? 0) - 1;
    const racing: WalletDeps = {
      ...deps,
      wallet: {
        ...store,
        append: async (rows) => {
          if (!burnt) {
            burnt = true;
            await store.burnExpired(now + 1, 0, () => 'burn');
          }
          return store.append(rows);
        },
      },
    };
    expect(await charge(racing, 1, 'b1', 9000)).toBe('ok');
    expect(await walletView(deps, 1)).toMatchObject({ bonus: 0, main: 11_000 });
  });

  it('still refuses the second of two charges the money cannot cover', async () => {
    const deps: WalletDeps = {
      wallet: createMemoryWallet(),
      promo: { ...PROMO, grants: 0 },
      people: { find: async () => undefined, idOf: async () => undefined },
      ...NO_LINKS,
      now: () => START,
      newId: () => `op-${Math.random()}`,
    };
    await adjust(deps, 900, 1, { balance: 'main', amount: 10_000, reason: 'test' });
    const results = await Promise.all([charge(deps, 1, 'b1', 9000), charge(deps, 1, 'b2', 9000)]);
    expect(results.sort()).toEqual(['not_enough', 'ok']);
    expect(await walletView(deps, 1)).toMatchObject({ bonus: 0, main: 1000 });
  });
});
