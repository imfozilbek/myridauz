import { describe, expect, it } from 'vitest';
import { testD1 } from '../../test-d1';
import { adminWallets } from './application/admin-wallets';
import type { WalletDeps } from './application/ports';
import { walletView } from './application/wallet-view';
import { d1Wallet } from './infrastructure/d1-wallet';
import { NO_LINKS } from './test-links';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse('2026-11-01T01:00:00Z');

async function twoDrivers() {
  const db = testD1();
  await db.exec(`INSERT INTO users (id, first_name, gender, phone, consent_at, created_at, updated_at)
    VALUES (1, 'D', 'male', '9981', 0, 0, 0), (2, 'D', 'male', '9982', 0, 0, 0)`);
  // Driver 1: a bonus over yesterday, not burnt yet; driver 2: money of his own.
  await db.exec(`INSERT INTO wallet_operations (id, driver_id, kind, balance, amount, expires_at, created_at)
    VALUES ('g1', 1, 'bonus_grant', 'bonus', 500000, ${NOW - DAY}, ${NOW - 20 * DAY}),
      ('m2', 2, 'admin_adjustment', 'main', 30000, NULL, 0)`);
  const deps: WalletDeps = {
    wallet: d1Wallet(db),
    promo: { amount: 500_000, grants: 3, days: 30, windowDays: 90 },
    // Driver 2 deleted the account: nobody to name.
    people: {
      find: async (id) => (id === 1 ? { firstName: 'D1', publicId: 'p1' } : undefined),
      idOf: async () => undefined,
    },
    ...NO_LINKS,
    now: () => NOW,
    newId: () => 'id',
  };
  return deps;
}

// G89 M11, M12: «Hamyon» shows the money there is; «Hamyonlar» only people with an account.
describe('the money on the screens', () => {
  it('shows no bonus whose time is over, before the Cron burns it', async () => {
    expect((await walletView(await twoDrivers(), 1)).bonus).toBe(0);
  });

  it('lists no driver who deleted the account', async () => {
    const { wallets } = await adminWallets(await twoDrivers(), 0);
    expect(wallets.map((wallet) => wallet.driverId)).toEqual(['p1']);
  });
});
