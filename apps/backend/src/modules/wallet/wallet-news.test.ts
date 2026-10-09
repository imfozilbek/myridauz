import { describe, expect, it } from 'vitest';
import { charge, grantWelcome } from './application/wallet';
import type { WalletDeps } from './application/ports';
import { warnBonusEnds } from './application/wallet-news';
import { createMemoryWallet } from './infrastructure/memory-wallet';
import { idOfPublic, publicIdOf } from '../../test-people';
import { NO_LINKS } from './test-links';

const DAY = 24 * 60 * 60 * 1000;
const START = Date.parse('2026-10-01T05:00:00Z');
// A seat of 90 000 soʻm costs 9 000 of commission: a bonus of 45 000 confirms 5 seats.
const PROMO = { amount: 45_000, grants: 1, days: 30, windowDays: 90 };
const SEAT = 9_000;

function setup() {
  let now = START;
  let id = 0;
  const told: string[] = [];
  const deps: WalletDeps = {
    wallet: createMemoryWallet(),
    promo: PROMO,
    people: { find: async (id) => ({ firstName: 'Jasur', publicId: publicIdOf(id) }), idOf: idOfPublic },
    ...NO_LINKS,
    lastPrice: async () => 90_000,
    tell: async (driverId, view, news) => void told.push(`${driverId} ${news} ${view.seatsLeft}`),
    now: () => now,
    newId: () => `op-${(id += 1)}`,
  };
  return { deps, told, later: (days: number) => void (now += days * DAY) };
}

// The wallet speaks in the driver bot twice at most (G68, docs/122): money for fewer than 5 seats,
// once when it drops under; and the bonus 3 days before it ends, once.
describe('the wallet in the driver bot (G68, docs/122)', () => {
  it('says once that the money confirms fewer than 5 seats', async () => {
    const { deps, told } = setup();
    await grantWelcome(deps, 1);
    await charge(deps, 1, 'b1', SEAT);
    await charge(deps, 1, 'b2', SEAT);
    expect(told).toEqual(['1 fewSeats 4']);
  });

  it('says 3 days before the end of the bonus, once', async () => {
    const { deps, told, later } = setup();
    await grantWelcome(deps, 1);
    later(26);
    await warnBonusEnds(deps);
    expect(told).toEqual([]);
    later(1);
    await warnBonusEnds(deps);
    later(1);
    await warnBonusEnds(deps);
    expect(told).toEqual(['1 bonusEnds 5']);
  });
});
