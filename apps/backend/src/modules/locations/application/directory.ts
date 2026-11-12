import type { Location, LocationsResponse } from '@platform/contracts';
import { toCyrillic } from '@platform/i18n';
import type { LocationsDeps } from './ports';

type Entry = { readonly response: LocationsResponse; readonly expiresAt: number };

// The names are written in Latin (docs/48); people read them in Cyrillic, made by the program of the
// texts (G98, docs/228). The version names the alphabet: a phone that kept the Latin names loads again.
const SOURCE = 'uz-Latn';
function inAlphabet(response: LocationsResponse, locale: string): LocationsResponse {
  if (locale === SOURCE) return response;
  return {
    version: `${response.version}.${locale}`,
    locations: response.locations.map((location) => ({ ...location, name: toCyrillic(location.name) })),
  };
}

// The directory almost never changes: one read of D1 serves many requests of this Worker instance.
export function cachedDirectory(ttlMs: number) {
  const entries = new Map<string, Entry>();
  return async (deps: LocationsDeps, locale: string): Promise<LocationsResponse> => {
    const now = deps.now();
    const entry = entries.get(locale);
    if (entry && entry.expiresAt > now) return entry.response;
    const response = inAlphabet(await deps.locations.directory(SOURCE), locale);
    entries.set(locale, { response, expiresAt: now + ttlMs });
    return response;
  };
}

export type Directory = ReturnType<typeof cachedDirectory>;

export const indexById = (locations: readonly Location[]) =>
  new Map(locations.map((location) => [location.id, location]));
