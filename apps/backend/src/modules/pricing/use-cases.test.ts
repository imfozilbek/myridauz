import type { Location } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { changeVariables, directions, preview, rollback, setDirection } from './application/admin';
import type { PricingDeps } from './application/ports';
import { recommendDirection, recommendPrice } from './application/recommend';
import { variablesCache } from './application/variables';
import { STRATEGIES } from './domain/formula';
import { createMemoryPricing } from './infrastructure/memory-pricing';

const place = (id: string, parentId: string | null, lat = 41): Location => ({
  id,
  parentId,
  type: parentId ? 'city' : 'region',
  name: id,
  lat,
  lng: 69,
  oneCity: false,
});
const PLACES = new Map(
  [
    place('17', null),
    place('1701', '17'),
    place('18', null, 40),
    place('1801', '18'),
    place('1802', '18', 40.1),
  ].map((item) => [item.id, item]),
);
const KM: Record<string, number> = { '1701:1801': 300, '1701:1802': 120, '1801:1802': 35 };

function setup() {
  const deps: PricingDeps = {
    pricing: createMemoryPricing(),
    places: {
      places: async () => PLACES,
      km: async (from, to) => {
        const km = KM[[from, to].sort().join(':')];
        return km === undefined ? { ok: false, error: 'locations.not_found' } : { ok: true, value: km };
      },
    },
    strategy: STRATEGIES['per-km'],
    variables: variablesCache(60_000),
    mainDirections: [['1701', '1801']],
    realPrices: async () => [],
    now: () => 1000,
  };
  return deps;
}
const per = STRATEGIES['per-km'];
const V = { ratePerKm: 300, roundStep: 5000, minPrice: 30000, maxPrice: 600000 };

describe('per-km formula (docs/16)', () => {
  it('gives the table of docs/16: km × 300, to the nearest 5 000', () => {
    const table = [
      [120, 35000],
      [290, 85000],
      [465, 140000],
      [490, 145000],
      [1150, 345000],
    ] as const;
    for (const [km, price] of table) expect(per(km, V)).toBe(price);
  });

  it('keeps the price within 30 000 … 600 000', () => {
    expect(per(35, V)).toBe(30000);
    expect(per(3000, V)).toBe(600000);
  });
});

describe('recommendation and the team prices (docs/09, docs/23)', () => {
  it('uses the formula, then a region price, then a place price, the closest first', async () => {
    const deps = setup();
    expect(await recommendPrice(deps, '1701', '1801')).toMatchObject({
      ok: true,
      value: { km: 300, price: 90000, source: 'formula', minPrice: 30000, maxPrice: 600000 },
    });
    await setDirection(deps, { from: '18', to: '17', price: 100000 }, 900);
    expect(await recommendPrice(deps, '1701', '1801')).toMatchObject({ value: { price: 100000 } });
    await setDirection(deps, { from: '1801', to: '1701', price: 95000 }, 900);
    expect(await recommendPrice(deps, '1801', '1701')).toMatchObject({
      value: { price: 95000, source: 'manual' },
    });
    await setDirection(deps, { from: '1801', to: '1701', price: null }, 900);
    expect(await recommendPrice(deps, '1701', '1801')).toMatchObject({ value: { price: 100000 } });
    expect(await recommendPrice(deps, '1701', '9')).toEqual({ ok: false, error: 'locations.not_found' });
  });

  it('measures a whole region from its place nearest to its center (G59)', async () => {
    const deps = setup();
    expect(await recommendDirection(deps, '17', '18')).toMatchObject({
      ok: true,
      value: { from: '17', to: '18', km: 120 },
    });
    // Every other caller keeps places only: the landing price of a region is refused (docs/59).
    expect(await recommendPrice(deps, '17', '18')).toEqual({ ok: false, error: 'locations.not_found' });
  });

  it('refuses a team price out of the bounds or for an unknown place', async () => {
    const deps = setup();
    expect(await setDirection(deps, { from: '1701', to: '1801', price: 700000 }, 900)).toEqual({
      ok: false,
      error: 'pricing.out_of_bounds',
    });
    expect(await setDirection(deps, { from: '1701', to: '1701', price: 50000 }, 900)).toEqual({
      ok: false,
      error: 'pricing.invalid_input',
    });
    expect(await setDirection(deps, { from: '1701', to: '99', price: 50000 }, 900)).toEqual({
      ok: false,
      error: 'locations.not_found',
    });
  });

  it('shows "было → стало", keeps every version and rolls back', async () => {
    const deps = setup();
    const next = { ...V, ratePerKm: 400 };
    expect(await preview(deps, next)).toEqual({
      rows: [{ from: '1701', to: '1801', km: 300, before: 90000, after: 120000 }],
    });
    const changed = await changeVariables(deps, next, 900);
    expect(changed.current).toMatchObject({ version: 2, variables: next, changedBy: 900 });
    expect(await recommendPrice(deps, '1701', '1801')).toMatchObject({ value: { price: 120000 } });
    const back = await rollback(deps, 1, 900);
    expect(back.ok && back.value.current).toMatchObject({ version: 3, variables: V });
    expect(back.ok && back.value.history).toHaveLength(3);
    expect(await rollback(deps, 9, 900)).toEqual({ ok: false, error: 'pricing.not_found' });
    expect(await directions(deps)).toEqual([
      { from: '1701', to: '1801', km: 300, formula: 90000, manual: null, median: null, medianTrips: 0 },
    ]);
  });

  it('lists the team prices first, then by distance (G41, docs/90 F-A8)', async () => {
    const deps = setup();
    await setDirection(deps, { from: '1701', to: '1802', price: 50000 }, 900);
    await setDirection(deps, { from: '1801', to: '1802', price: 30000 }, 900);
    const order = (await directions(deps)).map((row) => [row.km, row.manual]);
    expect(order).toEqual([
      [35, 30000],
      [120, 50000],
      [300, null],
    ]);
  });
});
