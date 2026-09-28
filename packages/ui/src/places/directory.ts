import type { LocationsClient } from '@platform/api-client';
import { matchesPlace, type Location } from '@platform/contracts';
import { createContext, useContext } from 'react';

// The directory of regions and places, ready for the picker (docs/14).
export type PlaceDirectory = {
  readonly regions: readonly Location[];
  readonly find: (id: string) => Location | undefined;
  readonly inside: (regionId: string) => readonly Location[];
  readonly search: (query: string) => readonly Location[];
};

// Enough to fill a phone screen: a longer query narrows the list.
const MAX_RESULTS = 30;

export function buildDirectory(locations: readonly Location[]): PlaceDirectory {
  const byId = new Map(locations.map((location) => [location.id, location]));
  const children = new Map<string, Location[]>();
  for (const location of locations) {
    if (location.parentId === null) continue;
    children.set(location.parentId, [...(children.get(location.parentId) ?? []), location]);
  }
  return {
    regions: locations.filter((location) => location.parentId === null),
    find: (id) => byId.get(id),
    inside: (regionId) => children.get(regionId) ?? [],
    search: (query) =>
      locations.filter((location) => matchesPlace(location.name, query)).slice(0, MAX_RESULTS),
  };
}

export const LocationsClientContext = createContext<LocationsClient | null>(null);

export function useLocationsClient(): LocationsClient {
  const client = useContext(LocationsClientContext);
  if (!client) throw new Error('ui.locations_client_missing');
  return client;
}
