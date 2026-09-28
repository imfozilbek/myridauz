import type { LocationsResponse } from '@platform/contracts';

// Ports of the locations module: D1 in production, memory in tests.
export type LocationRepository = {
  // The whole directory in one language, with a version that changes when the data changes.
  directory(locale: string): Promise<LocationsResponse>;
  // from < to: every pair is stored once.
  distance(from: string, to: string): Promise<number | undefined>;
  saveDistance(from: string, to: string, km: number, at: number): Promise<void>;
};

export type LocationsDeps = {
  readonly locations: LocationRepository;
  readonly now: () => number;
};

export type Result<T, E extends string> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };
