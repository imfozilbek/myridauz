import type { PricingVariables } from '@platform/contracts';

// A strategy turns road km into a price per seat (docs/23). A new one (demand, holidays)
// is one more entry here; the rest of the code does not change.
type Strategy = (km: number, variables: PricingVariables) => number;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

// km × rate, to the nearest step, within the bounds (docs/16).
const perKm: Strategy = (km, { ratePerKm, roundStep, minPrice, maxPrice }) =>
  clamp(Math.round((km * ratePerKm) / roundStep) * roundStep, minPrice, maxPrice);

export const STRATEGIES = { 'per-km': perKm } as const satisfies Record<string, Strategy>;
export type { Strategy };

export const withinBounds = (price: number, variables: PricingVariables) =>
  price >= variables.minPrice && price <= variables.maxPrice;
