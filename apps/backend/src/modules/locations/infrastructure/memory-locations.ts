import type { Location } from '@platform/contracts';
import type { DistanceChange, LocationRepository } from '../application/ports';

// In memory: tests and local runs without D1. Counts directory reads to test the cache.
export function createMemoryLocations(initial: readonly Location[] = []) {
  let locations = [...initial];
  const distances = new Map<string, number>();
  const changes: (DistanceChange & { readonly pair: string })[] = [];
  let reads = 0;
  const repository: LocationRepository = {
    directory: async () => {
      reads += 1;
      return { version: '1', locations: [...locations] };
    },
    distance: async (from, to) => distances.get(`${from}-${to}`),
    saveDistance: async (from, to, km) => void distances.set(`${from}-${to}`, km),
    correctDistance: async (from, to, change) => {
      const pair = `${from}-${to}`;
      changes.unshift({ pair, before: distances.get(pair) ?? null, ...change });
      distances.set(pair, change.after);
    },
    distanceChanges: async (from, to) => changes.filter((change) => change.pair === `${from}-${to}`),
  };
  const load = (next: readonly Location[]) => void (locations = [...next]);
  return { ...repository, load, reads: () => reads };
}
