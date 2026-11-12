import type { Location, LocationsResponse } from '@platform/contracts';
import { byCyrillic, toCyrillic } from '@platform/i18n';
import type { LocationsDeps } from './ports';

type Entry = { readonly response: LocationsResponse; readonly expiresAt: number };

// The names are written in Latin (docs/48); people read them in Cyrillic, made by the program of the
// texts (G98, docs/228). The version names the alphabet: a phone that kept the Latin names loads again.
// The regions keep the order the team gave them; the places of a region go by the Cyrillic alphabet
// (lesson 392): the base sorts them by their Latin names.
const SOURCE = 'uz-Latn';
const ORDER = 'cyrl2';
function inAlphabet(response: LocationsResponse, locale: string): LocationsResponse {
  if (locale === SOURCE) return response;
  const shown = response.locations.map((location) => ({ ...location, name: toCyrillic(location.name) }));
  const regions = shown.filter((location) => location.parentId === null);
  const places = shown
    .filter((location) => location.parentId !== null)
    .sort((one, other) => byCyrillic(one.name, other.name));
  return { version: `${response.version}.${locale}.${ORDER}`, locations: [...regions, ...places] };
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
