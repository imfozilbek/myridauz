import type { Location, PricingVariables, PricingVersion, RouteError } from '@platform/contracts';
import type { Strategy } from '../domain/formula';
import type { VariablesCache } from './variables';

// Ports of the pricing module: D1 in production, memory in tests.
export type PricingRepository = {
  // Newest first; there is always at least the starting version (migrations/0006_pricing.sql).
  versions(): Promise<PricingVersion[]>;
  addVersion(variables: PricingVariables, changedBy: number, at: number): Promise<void>;
  // Pairs are ordered (domain/direction.ts).
  manualPrice(from: string, to: string): Promise<number | undefined>;
  manualPrices(): Promise<{ readonly from: string; readonly to: string; readonly price: number }[]>;
  setManualPrice(
    from: string,
    to: string,
    price: number | null,
    changedBy: number,
    at: number,
  ): Promise<void>;
};

export type RouteKmError = RouteError | 'locations.not_found';

// What pricing needs from the locations module.
type PlacesPort = {
  places(): Promise<ReadonlyMap<string, Location>>;
  km(from: string, to: string): Promise<Result<number, RouteKmError>>;
};

export type PricingDeps = {
  readonly pricing: PricingRepository;
  readonly places: PlacesPort;
  readonly strategy: Strategy;
  readonly variables: VariablesCache;
  // Directions shown in "было → стало" and in the admin table (docs/16).
  readonly mainDirections: readonly (readonly [string, string])[];
  readonly now: () => number;
};

export type Result<T, E extends string> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };
