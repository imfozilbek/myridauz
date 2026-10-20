import type { Recommendation } from '@platform/contracts';
import { directionKeys } from '../domain/direction';
import { measuredPlace } from '../domain/measured-place';
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
// A manual price set before the owner moved the bounds stays inside them (docs/23 «ограничить: min …
// max», G89 T9): nobody is advised a price no driver may publish.
const within = (price: number, bounds: { minPrice: number; maxPrice: number }) =>
  Math.min(bounds.maxPrice, Math.max(bounds.minPrice, price));

export async function recommendPrice(
  deps: PricingDeps,
  from: string,
  to: string,
): Promise<Result<Recommendation, RouteKmError>> {
  const km = await deps.places.km(from, to);
  if (!km.ok) return km;
  const variables = await deps.variables.get(deps.pricing, deps.now());
  const manual = await manualFor(deps, from, to);
  const bounds = {
    minPrice: variables.minPrice,
    maxPrice: variables.maxPrice,
    roundStep: variables.roundStep,
  };
  const base = { from, to, km: km.value, ...bounds };
  return manual === undefined
    ? { ok: true, value: { ...base, price: deps.strategy(km.value, variables), source: 'formula' } }
    : { ok: true, value: { ...base, price: within(manual, bounds), source: 'manual' } };
}

// A direction of «Qayerga borasiz?» (G59) and a request of a passenger (G52) may end in a whole region:
// the same recommendation, measured from the place of the region nearest to its center. The landing
// keeps places only (docs/59).
export async function recommendDirection(
  deps: PricingDeps,
  from: string,
  to: string,
): Promise<Result<Recommendation, RouteKmError>> {
  const places = await deps.places.places();
  const result = await recommendPrice(deps, measuredPlace(from, places), measuredPlace(to, places));
  return result.ok ? { ok: true, value: { ...result.value, from, to } } : result;
}
