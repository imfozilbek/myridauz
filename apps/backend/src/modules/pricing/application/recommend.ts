import type { Recommendation } from '@platform/contracts';
import { directionKeys } from '../domain/direction';
import type { PricingDeps, Result, RouteKmError } from './ports';

// The team's price for the places or their regions, if any (docs/09: it goes first).
async function manualFor(deps: PricingDeps, from: string, to: string): Promise<number | undefined> {
  const places = await deps.places.places();
  const a = places.get(from);
  const b = places.get(to);
  if (!a || !b) return undefined;
  for (const [x, y] of directionKeys(a, b)) {
    const price = await deps.pricing.manualPrice(x, y);
    if (price !== undefined) return price;
  }
  return undefined;
}

// One function for every place that shows a price: bots, Mini Apps, channels (docs/23).
export async function recommendPrice(
  deps: PricingDeps,
  from: string,
  to: string,
): Promise<Result<Recommendation, RouteKmError>> {
  const km = await deps.places.km(from, to);
  if (!km.ok) return km;
  const variables = await deps.variables.get(deps.pricing, deps.now());
  const manual = await manualFor(deps, from, to);
  const bounds = { minPrice: variables.minPrice, maxPrice: variables.maxPrice };
  const base = { from, to, km: km.value, ...bounds };
  return manual === undefined
    ? { ok: true, value: { ...base, price: deps.strategy(km.value, variables), source: 'formula' } }
    : { ok: true, value: { ...base, price: manual, source: 'manual' } };
}
