import { describe, expect, it } from 'vitest';
import { changeVariables, setDirection } from './application/admin';
import { recommendPrice } from './application/recommend';
import { setup, V } from './pricing-test-kit';

describe('a manual price and the bounds (docs/23)', () => {
  // G89 T9: the owner raised the lowest price after a manual one: the advice stays inside the bounds.
  it('keeps a manual price inside bounds moved later', async () => {
    const deps = setup();
    await setDirection(deps, { from: '1801', to: '1701', price: 35000 }, 900);
    await changeVariables(deps, { ...V, minPrice: 40000 }, 900);
    expect(await recommendPrice(deps, '1801', '1701')).toMatchObject({
      value: { price: 40000, source: 'manual', minPrice: 40000 },
    });
  });
});
