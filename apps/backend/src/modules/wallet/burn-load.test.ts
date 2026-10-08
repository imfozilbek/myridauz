import { describe, expect, it } from 'vitest';
import { IN_LIST_LIMIT } from '../../shared/storage/in-list';
import { fullScans, testD1 } from '../../test-d1';
import { grantMissedWelcome } from './application/missed';
import { burnExpired } from './application/wallet';
import { walletView } from './application/wallet-view';
import type { WalletDeps } from './application/ports';
import { d1Wallet } from './infrastructure/d1-wallet';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse('2026-11-01T01:00:00Z');
const DRIVERS = 5000;

// The Cron job burns the bonuses that are over for thousands of drivers in a few queries, not one
// read per driver: a run stays within the limits of D1 (G42, docs/111, docs/61).
function counted(db: D1Database) {
  let queries = 0;
  const counting = new Proxy(db, {
    get: (target, key) => {
      const value = Reflect.get(target, key) as unknown;
      if ((key === 'prepare' || key === 'exec') && typeof value === 'function')
        return (...args: unknown[]) => ((queries += 1), (value as (...a: unknown[]) => unknown)(...args));
      return value;
    },
  });
  return { db: counting, queries: () => queries };
}

describe('burning bonuses at scale', () => {
  it('burns the bonuses of 5 000 drivers in one statement', async () => {
    const raw = testD1();
    await raw.exec(`WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < ${DRIVERS})
      INSERT INTO users (id, first_name, gender, phone, consent_at, created_at, updated_at)
      SELECT i, 'D', 'male', '998' || i, 0, 0, 0 FROM n`);
    // Odd drivers: the bonus is over; even ones: it lives 10 more days.
    await raw.exec(`INSERT INTO wallet_operations (id, driver_id, kind, balance, amount, expires_at, created_at)
      SELECT 'g' || id, id, 'bonus_grant', 'bonus', 500000,
        CASE WHEN id % 2 = 1 THEN ${NOW - DAY} ELSE ${NOW + 10 * DAY} END, ${NOW - 20 * DAY} FROM users`);
    const { db, queries } = counted(raw);
    let id = 0;
    const deps: WalletDeps = {
      wallet: d1Wallet(db),
      promo: { amount: 500_000, grants: 3, days: 30, windowDays: 90 },
      people: { find: async () => undefined, idOf: async () => undefined },
      passengers: async () => new Map(),
      now: () => NOW,
      newId: () => `id${(id += 1)}`,
    };
    await burnExpired(deps);
    expect(queries()).toBeLessThanOrEqual(2);
    expect((await walletView(deps, 1)).bonus).toBe(0);
    expect((await walletView(deps, 2)).bonus).toBe(500_000);
    await burnExpired(deps);
    expect((await walletView(deps, 1)).bonus).toBe(0);
    // Approved drivers who all have a wallet: one batch read through the index, parts of 90 ids (G56).
    const before = queries();
    await grantMissedWelcome(
      deps,
      Array.from({ length: DRIVERS }, (_, index) => index + 1),
    );
    expect(queries() - before).toBe(Math.ceil(DRIVERS / IN_LIST_LIMIT));
    expect(fullScans(raw)).toEqual([]);
  });
});
