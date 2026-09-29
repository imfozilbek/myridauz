import type { PricingVariables } from '@platform/contracts';
import type { PricingRepository } from './ports';

// The variables are read on every price: one read of D1 serves this Worker instance for a while.
// A change in the admin Mini App clears this instance at once; others follow within the TTL (docs/23).
export function variablesCache(ttlMs: number) {
  let cached: { readonly variables: PricingVariables; readonly until: number } | null = null;
  return {
    get: async (pricing: PricingRepository, now: number): Promise<PricingVariables> => {
      if (cached && cached.until > now) return cached.variables;
      const [latest] = await pricing.versions();
      if (!latest) throw new Error('pricing.no_variables');
      cached = { variables: latest.variables, until: now + ttlMs };
      return latest.variables;
    },
    forget: () => {
      cached = null;
    },
  };
}

export type VariablesCache = ReturnType<typeof variablesCache>;
