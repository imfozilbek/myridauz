import type { PricingVariables, PricingVersion } from '@platform/contracts';
import type { PricingRepository } from '../application/ports';

// The same start as migrations/0006_pricing.sql (docs/16).
const START: PricingVariables = { ratePerKm: 300, roundStep: 5000, minPrice: 30000, maxPrice: 600000 };

export function createMemoryPricing(): PricingRepository {
  const versions: PricingVersion[] = [{ version: 1, variables: START, changedBy: null, changedAt: 0 }];
  const manual = new Map<string, number>();
  return {
    versions: async () => [...versions].reverse(),
    addVersion: async (variables, changedBy, at) => {
      versions.push({ version: versions.length + 1, variables, changedBy, changedAt: at });
    },
    manualPrice: async (from, to) => manual.get(`${from}:${to}`),
    manualPrices: async () =>
      [...manual].map(([key, price]) => {
        const [from = '', to = ''] = key.split(':');
        return { from, to, price };
      }),
    setManualPrice: async (from, to, price) => {
      if (price === null) manual.delete(`${from}:${to}`);
      else manual.set(`${from}:${to}`, price);
    },
  };
}
