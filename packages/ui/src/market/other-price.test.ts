import { describe, expect, it } from 'vitest';
import { trip } from './market-test-kit';
import { otherPrice } from './other-price';

describe('«Tavsiya etilgan narx» (G35, docs/97 PS10)', () => {
  it('is shown only when it differs from the price of the trip', () => {
    expect(otherPrice({ ...trip, price: 95000, recommendedPrice: 95000 })).toBeNull();
    expect(otherPrice({ ...trip, price: 95000, recommendedPrice: null })).toBeNull();
    expect(otherPrice({ ...trip, price: 100000, recommendedPrice: 95000 })).toBe(95000);
  });
});
