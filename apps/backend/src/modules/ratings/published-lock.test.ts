import { describe, expect, it } from 'vitest';
import { rate } from './application/rate';
import { DRIVER, review, setup } from './ratings-test-kit';

const PASSENGER = 101;

// G89 A7 (owner decision 20.10.2026): once both reviews show, the stars stay; nobody answers a bad
// review with revenge (docs/24). A blind review may still change.
describe('a published review', () => {
  it('changes while blind and stays once both sides rated', async () => {
    const { deps } = setup();
    await rate(deps, PASSENGER, review('b1', 5));
    expect(await rate(deps, PASSENGER, review('b1', 4, 'Yaxshi'))).toBe('ok');
    await rate(deps, DRIVER, review('b1', 2));
    expect(await rate(deps, PASSENGER, review('b1', 1))).toBe('reviews.published');
    expect(await rate(deps, PASSENGER, review('b1', 1), true)).toBe('reviews.published');
    expect(await deps.store.review('b1', PASSENGER)).toMatchObject({ stars: 4, text: 'Yaxshi' });
  });

  it('lets the second side write once: its first review publishes both', async () => {
    const { deps } = setup();
    await rate(deps, PASSENGER, review('b1', 5));
    expect(await rate(deps, DRIVER, review('b1', 2))).toBe('ok');
    expect(await rate(deps, DRIVER, review('b1', 1))).toBe('reviews.published');
  });
});
