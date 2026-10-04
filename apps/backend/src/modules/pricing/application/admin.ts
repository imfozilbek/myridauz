import {
  DAY_MS,
  MEDIAN_DAYS,
  type Direction,
  type DirectionPrice,
  type PricingPreview,
  type PricingState,
  type PricingVariables,
} from '@platform/contracts';
import { orderedPair } from '../domain/direction';
import { withinBounds } from '../domain/formula';
import { medianPrice, onDirection } from '../domain/median';
import type { PricingDeps, Result } from './ports';

// The team changes the formula in one place (docs/23): every change is a new version.
export async function pricingState(deps: PricingDeps): Promise<PricingState> {
  const history = await deps.pricing.versions();
  const [current] = history;
  if (!current) throw new Error('pricing.no_variables');
  return { current, history };
}

// "Было → стало" on the main directions before the team saves new variables.
export async function preview(deps: PricingDeps, next: PricingVariables): Promise<PricingPreview> {
  const now = await deps.variables.get(deps.pricing, deps.now());
  const rows = await Promise.all(
    deps.mainDirections.map(async ([from, to]) => {
      const km = await deps.places.km(from, to);
      if (!km.ok) return null;
      return {
        from,
        to,
        km: km.value,
        before: deps.strategy(km.value, now),
        after: deps.strategy(km.value, next),
      };
    }),
  );
  return { rows: rows.filter((row) => row !== null) };
}

export async function changeVariables(deps: PricingDeps, next: PricingVariables, by: number) {
  await deps.pricing.addVersion(next, by, deps.now());
  deps.variables.forget();
  return pricingState(deps);
}

// A rollback is a new version with the old values: the history keeps everything.
export async function rollback(
  deps: PricingDeps,
  version: number,
  by: number,
): Promise<Result<PricingState, 'pricing.not_found'>> {
  const old = (await deps.pricing.versions()).find((item) => item.version === version);
  if (!old) return { ok: false, error: 'pricing.not_found' };
  return { ok: true, value: await changeVariables(deps, old.variables, by) };
}

// The admin table: the main directions and every direction with the team's price,
// with the median of real prices of the last MEDIAN_DAYS days as a hint (docs/09).
// One order (G41, docs/90 F-A8): the team's own prices first, then the nearest directions.
const byManualThenKm = (a: Direction, b: Direction) =>
  Number(a.manual === null) - Number(b.manual === null) || (a.km ?? Infinity) - (b.km ?? Infinity);

export async function directions(deps: PricingDeps): Promise<Direction[]> {
  const variables = await deps.variables.get(deps.pricing, deps.now());
  const [manual, real, places] = await Promise.all([
    deps.pricing.manualPrices(),
    deps.realPrices(deps.now() - MEDIAN_DAYS * DAY_MS),
    deps.places.places(),
  ]);
  const pairs = new Map<string, readonly [string, string]>();
  for (const pair of [...deps.mainDirections, ...manual.map((item) => [item.from, item.to] as const)])
    pairs.set(orderedPair(...pair).join(':'), pair);
  const rows = await Promise.all(
    [...pairs.values()].map(async ([from, to]) => {
      const km = await deps.places.km(from, to);
      const [a, b] = orderedPair(from, to);
      const own = manual.find((item) => item.from === a && item.to === b)?.price ?? null;
      const formula = km.ok ? deps.strategy(km.value, variables) : null;
      const prices = real.filter((trip) => onDirection(trip, from, to, places)).map((trip) => trip.price);
      const median = medianPrice(prices);
      return {
        from,
        to,
        km: km.ok ? km.value : null,
        formula,
        manual: own,
        median,
        medianTrips: prices.length,
      };
    }),
  );
  return rows.sort(byManualThenKm);
}

type DirectionError = 'locations.not_found' | 'pricing.out_of_bounds' | 'pricing.invalid_input';

// The team's price for a direction (region or place): it goes before the formula (docs/09).
export async function setDirection(
  deps: PricingDeps,
  input: DirectionPrice,
  by: number,
): Promise<Result<Direction[], DirectionError>> {
  const places = await deps.places.places();
  if (!places.has(input.from) || !places.has(input.to)) return { ok: false, error: 'locations.not_found' };
  if (input.from === input.to) return { ok: false, error: 'pricing.invalid_input' };
  const variables = await deps.variables.get(deps.pricing, deps.now());
  if (input.price !== null && !withinBounds(input.price, variables))
    return { ok: false, error: 'pricing.out_of_bounds' };
  await deps.pricing.setManualPrice(...orderedPair(input.from, input.to), input.price, by, deps.now());
  return { ok: true, value: await directions(deps) };
}
