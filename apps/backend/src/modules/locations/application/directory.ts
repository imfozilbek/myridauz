import type { Location, LocationsResponse } from '@platform/contracts';
import type { LocationsDeps } from './ports';

type Entry = { readonly response: LocationsResponse; readonly expiresAt: number };

// The directory almost never changes: one read of D1 serves many requests of this Worker instance.
export function cachedDirectory(ttlMs: number) {
  const entries = new Map<string, Entry>();
  return async (deps: LocationsDeps, locale: string): Promise<LocationsResponse> => {
    const now = deps.now();
    const entry = entries.get(locale);
    if (entry && entry.expiresAt > now) return entry.response;
    const response = await deps.locations.directory(locale);
    entries.set(locale, { response, expiresAt: now + ttlMs });
    return response;
  };
}

export type Directory = ReturnType<typeof cachedDirectory>;

export const indexById = (locations: readonly Location[]) =>
  new Map(locations.map((location) => [location.id, location]));
