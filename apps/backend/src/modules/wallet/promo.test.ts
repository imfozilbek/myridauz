import { describe, expect, it } from 'vitest';
import { welcomeGrant } from './domain/promo';

const NOW = Date.parse('2026-10-20T05:00:00Z');
const PROMO = { amount: 500_000, grants: 3, days: 30, windowDays: 90 };

// The owner sets the promo in «Cheklovlar» (G75): no grants, or no amount, means no bonus at all.
describe('bonus 1 (docs/12)', () => {
  it('comes once at the approval', () => {
    expect(welcomeGrant([], PROMO, NOW)).toEqual({ amount: 500_000, expiresAt: NOW + 30 * 86_400_000 });
  });

  it('never comes when the owner set 0 bonuses or a bonus of 0 (G89 M4)', () => {
    expect(welcomeGrant([], { ...PROMO, grants: 0 }, NOW)).toBeNull();
    expect(welcomeGrant([], { ...PROMO, amount: 0 }, NOW)).toBeNull();
  });
});
