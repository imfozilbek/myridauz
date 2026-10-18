import type { LocationsResponse } from '@platform/contracts';
import type { Names } from '../../../shared/team/who';

// A correction of a distance by the owner (G45): the km before (none for a new pair) and after.
export type DistanceChange = {
  readonly before: number | null;
  readonly after: number;
  readonly by: number;
  readonly at: number;
};

// Ports of the locations module: D1 in production, memory in tests.
export type LocationRepository = {
  // The whole directory in one language, with a version that changes when the data changes.
  directory(locale: string): Promise<LocationsResponse>;
  // from < to: every pair is stored once.
  distance(from: string, to: string): Promise<number | undefined>;
  saveDistance(from: string, to: string, km: number, at: number): Promise<void>;
  // The owner's correction: the distance and its history in one step (G45).
  correctDistance(from: string, to: string, change: Omit<DistanceChange, 'before'>): Promise<void>;
  distanceChanges(from: string, to: string): Promise<DistanceChange[]>;
};

export type LocationsDeps = {
  readonly locations: LocationRepository;
  readonly names: Names;
  readonly now: () => number;
};

export type Result<T, E extends string> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };
