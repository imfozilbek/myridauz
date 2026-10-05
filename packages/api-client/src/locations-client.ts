import { LOCATIONS_PATH, locationsResponseSchema, type LocationsResponse } from '@platform/contracts';
import { ApiError } from './api-error';
import type { Fetch } from './fetch';
import { fetchOnce, REQUEST_TIMEOUT_MS } from './network';

type LocationsClientOptions = { readonly baseUrl: string; readonly fetch: Fetch };

// The directory is public and cached by the browser; the Mini App asks for it once per session.
export function createLocationsClient({ baseUrl, fetch }: LocationsClientOptions) {
  const url = new URL(LOCATIONS_PATH.slice(1), `${baseUrl.replace(/\/$/, '')}/`).toString();
  let pending: Promise<LocationsResponse> | null = null;
  async function load(): Promise<LocationsResponse> {
    const response = await fetchOnce(fetch, url, {}, REQUEST_TIMEOUT_MS);
    if (!response.ok) throw new ApiError(response.status);
    return locationsResponseSchema.parse(await response.json());
  }
  return {
    getLocations(): Promise<LocationsResponse> {
      // A failed load is forgotten, so "try again" asks the server again.
      pending ??= load().catch((error: unknown) => {
        pending = null;
        throw error;
      });
      return pending;
    },
  };
}

export type LocationsClient = ReturnType<typeof createLocationsClient>;
