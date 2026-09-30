import {
  MAP_ARCHIVE,
  MAP_FONTS_PATH,
  MAP_PATH,
  MAP_SEARCH_PATH,
  placeSearchSchema,
  type FoundPlace,
  type Point,
} from '@platform/contracts';
import { signedRequest, type SignedOptions } from './signed-request';

// Where the map library reads the map of the Mini App (G22, docs/67): public, no signature.
// The search of places by name (G23) carries the signature like every other call.
export function createMapClient(options: SignedOptions) {
  const base = options.baseUrl.replace(/\/$/u, '');
  const { request } = signedRequest(options);
  return {
    archiveUrl: `${base}${MAP_PATH}/${MAP_ARCHIVE}`,
    // The map library fills in {fontstack} and {range} itself.
    fontsUrl: `${base}${MAP_FONTS_PATH}/{fontstack}/{range}.pbf`,
    search: async (query: string, near: Point): Promise<FoundPlace[]> => {
      const asked = new URLSearchParams({ q: query, near: `${near.lat},${near.lng}` });
      const response = await request(`${MAP_SEARCH_PATH}?${asked.toString()}`);
      return placeSearchSchema.parse(await response.json()).places;
    },
  };
}

export type MapClient = ReturnType<typeof createMapClient>;
