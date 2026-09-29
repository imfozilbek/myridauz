import { loadBrand } from '@platform/brands';
import type { Bindings } from '../../env';
import MAIN_DIRECTIONS from '../../../seed/main-directions.json';
import { placesOf, routeKm } from '../locations';
import type { PricingDeps } from './application/ports';
import { recommendPrice } from './application/recommend';
import { variablesCache } from './application/variables';
import { STRATEGIES } from './domain/formula';
import { pricingRoutes } from './http/pricing-routes';
import { d1Pricing } from './infrastructure/d1-pricing';
import { createMemoryPricing } from './infrastructure/memory-pricing';

const VARIABLES_TTL_MS = 60 * 1000;
const cache = variablesCache(VARIABLES_TTL_MS);
// Without D1 (tests) the variables and the team's prices live in memory.
const localPricing = createMemoryPricing();

const pricingDeps = (env: Bindings): PricingDeps => ({
  pricing: env.DB ? d1Pricing(env.DB) : localPricing,
  places: {
    places: () => placesOf(env),
    km: async (from, to) => {
      const result = await routeKm(env, from, to);
      return result.ok ? { ok: true, value: result.value.km } : result;
    },
  },
  strategy: STRATEGIES[loadBrand(env.BRAND).pricing],
  variables: cache,
  mainDirections: MAIN_DIRECTIONS.map(([from = '', to = '']) => [from, to] as const),
  now: Date.now,
});

export const pricingModule = pricingRoutes(pricingDeps);

// For trips and ride requests: the recommendation and the bounds of a price (docs/09).
export const recommendationFor = (env: Bindings, from: string, to: string) =>
  recommendPrice(pricingDeps(env), from, to);
