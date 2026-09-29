import { describe, expect, it } from 'vitest';
import { commissionFor, refundsCommission } from './domain/commission';

const RULE = { percent: 10, minPerSeat: 3000 };

describe('the commission of a booking (docs/12)', () => {
  it('takes 10% of the price per seat, times the seats', () => {
    expect(commissionFor(RULE, 90_000, 1)).toBe(9000);
    expect(commissionFor(RULE, 90_000, 3)).toBe(27_000);
  });

  it('never takes less than 3 000 per seat', () => {
    expect(commissionFor(RULE, 25_000, 1)).toBe(3000);
    expect(commissionFor(RULE, 30_000, 2)).toBe(6000);
  });

  it('gives it back only when the passenger cancelled', () => {
    expect(refundsCommission('passenger')).toBe(true);
    expect(refundsCommission('driver')).toBe(false);
  });
});
