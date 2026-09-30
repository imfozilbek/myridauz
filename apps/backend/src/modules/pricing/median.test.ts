import type { Location } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { directions } from './application/admin';
import type { PricingDeps, RealPrice } from './application/ports';
import { variablesCache } from './application/variables';
import { STRATEGIES } from './domain/formula';
import { medianPrice, onDirection } from './domain/median';
import { createMemoryPricing } from './infrastructure/memory-pricing';

const place = (id: string, parentId: string | null): Location => ({
  id,
  parentId,
  type: parentId ? 'city' : 'region',
  name: id,
  lat: 41,
  lng: 69,
  oneCity: false,
});
const PLACES = new Map(
  [place('17', null), place('1701', '17'), place('18', null), place('1801', '18')].map((item) => [
    item.id,
    item,
  ]),
);
const trips = (count: number, price = 90_000): RealPrice[] =>
  Array.from({ length: count }, (_, index) => ({
    from: index % 2 === 0 ? '1701' : '1801',
    to: index % 2 === 0 ? '1801' : '1701',
    price: price + index * 1000,
  }));

const deps = (real: readonly RealPrice[]): PricingDeps => ({
  pricing: createMemoryPricing(),
  places: { places: async () => PLACES, km: async () => ({ ok: true, value: 300 }) },
  strategy: STRATEGIES['per-km'],
  variables: variablesCache(60_000),
  mainDirections: [['17', '18']],
  realPrices: async () => real,
  now: () => Date.parse('2026-10-01T00:00:00Z'),
});

describe('the median of real prices for the team (docs/09, question 39)', () => {
  it('is counted only from 10 trips on', () => {
    expect(medianPrice([1, 2, 3, 4, 5, 6, 7, 8, 9])).toBeNull();
    expect(medianPrice([10, 1, 9, 2, 8, 3, 7, 4, 6, 5])).toBe(6);
    expect(medianPrice([10, 1, 9, 2, 8, 3, 7, 4, 6, 5, 100])).toBe(6);
  });

  it('takes trips both ways and the places of a region in the table', () => {
    expect(onDirection({ from: '1801', to: '1701' }, '17', '18', PLACES)).toBe(true);
    expect(onDirection({ from: '1701', to: '1801' }, '1701', '1801', PLACES)).toBe(true);
    expect(onDirection({ from: '1701', to: '1701' }, '17', '18', PLACES)).toBe(false);
  });

  it('shows the hint in the admin table next to the formula, never instead of it', async () => {
    const [few] = await directions(deps(trips(9)));
    expect(few).toMatchObject({ median: null, medianTrips: 9, formula: 90000 });
    const [enough] = await directions(deps(trips(10)));
    expect(enough).toMatchObject({ median: 94500, medianTrips: 10, formula: 90000, manual: null });
  });
});
