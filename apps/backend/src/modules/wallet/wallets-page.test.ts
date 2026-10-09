import { describe, expect, it } from 'vitest';
import { testD1 } from '../../test-d1';
import { adminWallets, WALLETS_PAGE } from './application/admin-wallets';
import type { WalletDeps } from './application/ports';
import { d1Wallet } from './infrastructure/d1-wallet';
import { NO_LINKS } from './test-links';

const DRIVERS = 5000;

// "Hamyonlar" by pages: one query for the balances of a page, never one read per driver; the least
// money first (G42, docs/111; G41, docs/90 F-A5).
describe('the wallets of the team by pages', () => {
  it('reads a page of 5 000 drivers in one query, the least money first', async () => {
    const raw = testD1();
    await raw.exec(`WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < ${DRIVERS})
      INSERT INTO users (id, first_name, gender, phone, consent_at, created_at, updated_at)
      SELECT i, 'D', 'male', '998' || i, 0, 0, 0 FROM n`);
    await raw.exec(`INSERT INTO wallet_operations (id, driver_id, kind, balance, amount, created_at)
      SELECT 'm' || id, id, 'admin_adjustment', 'main', id * 1000, 0 FROM users`);
    let queries = 0;
    const db = new Proxy(raw, {
      get: (target, key) =>
        key === 'prepare'
          ? (sql: string) => ((queries += 1), target.prepare(sql))
          : (Reflect.get(target, key) as unknown),
    });
    const deps: WalletDeps = {
      wallet: d1Wallet(db),
      promo: { amount: 500_000, grants: 3, days: 30, windowDays: 90 },
      people: {
        find: async (id) => ({ firstName: `D${id}`, publicId: `p${id}` }),
        idOf: async () => undefined,
      },
      ...NO_LINKS,
      now: () => 0,
      newId: () => 'id',
    };
    const first = await adminWallets(deps, 0);
    expect(queries).toBe(1);
    expect(first.wallets).toHaveLength(WALLETS_PAGE);
    expect(first.more).toBe(true);
    expect(first.wallets[0]).toEqual({ driverId: 'p1', firstName: 'D1', bonus: 0, main: 1000 });
    const last = await adminWallets(deps, Math.ceil(DRIVERS / WALLETS_PAGE) - 1);
    expect(last.more).toBe(false);
    expect(last.wallets.at(-1)?.driverId).toBe(`p${DRIVERS}`);
  });
});
