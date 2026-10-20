import type { Location } from '@platform/contracts';
import type { PricingDeps } from './application/ports';
import { variablesCache } from './application/variables';
import { STRATEGIES } from './domain/formula';
import { createMemoryPricing } from './infrastructure/memory-pricing';

// Test helper of the prices: two regions with places, the km between them and the formula per km.
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

export function setup() {
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
    names: async (ids) => new Map(ids.map((id) => [id, `Member ${id}`])),
    now: () => 1000,
  };
  return deps;
}
export const V = { ratePerKm: 300, roundStep: 5000, minPrice: 30000, maxPrice: 600000 };
