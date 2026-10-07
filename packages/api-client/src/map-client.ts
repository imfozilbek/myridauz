import {
  MAP_ARCHIVE,
  MAP_FONTS_PATH,
  MAP_PATH,
  MAP_NEAR_PATH,
  MAP_SEARCH_PATH,
  MAP_WHERE_PATH,
  placeSearchSchema,
  whereSchema,
  borderSchema,
  mapBorderPath,
  PITAK_OF_DIRECTION_PATH,
  pitakOfDirectionSchema,
  type Border,
  type Pitak,
  type Where,
  type FoundPlace,
  type Point,
} from '@platform/contracts';
import { signedRequest, type SignedOptions } from './signed-request';

// Where the map library reads the map of the Mini App (G22, docs/67): public, no signature. In
// production the public R2 bucket of the brand answers (mapUrl, G57); locally and on the stand the API.
// The search of places by name (G23) carries the signature like every other call.
export function createMapClient(options: SignedOptions & { readonly mapUrl?: string }) {
  const base = (options.mapUrl ?? options.baseUrl).replace(/\/$/u, '');
  const { request } = signedRequest(options);
  return {
    archiveUrl: `${base}${MAP_PATH}/${MAP_ARCHIVE}`,
    // The map library fills in {fontstack} and {range} itself.
    fontsUrl: `${base}${MAP_FONTS_PATH}/{fontstack}/{range}.pbf`,
    // With a zone (G26, docs/74) only inside it: a district or a region.
    search: async (query: string, near: Point, zone?: string): Promise<FoundPlace[]> => {
      const asked = new URLSearchParams({ q: query, near: `${near.lat},${near.lng}` });
      if (zone) asked.set('zone', zone);
      const response = await request(`${MAP_SEARCH_PATH}?${asked.toString()}`);
      return placeSearchSchema.parse(await response.json()).places;
    },
    // The border of a district or of a whole region: its map is cut by it (docs/71, docs/74).
    border: async (placeId: string): Promise<Border> =>
      borderSchema.parse(await (await request(mapBorderPath(placeId))).json()),
    // The main pitak of a direction of regions, when people may see it (docs/72).
    pitakOf: async (from: string, to: string): Promise<Pitak | null> => {
      const response = await request(`${PITAK_OF_DIRECTION_PATH}?from=${from}&to=${to}`);
      return pitakOfDirectionSchema.parse(await response.json()).pitak;
    },
    // «Yaqin joylar»: the known places around the pin (docs/126).
    near: async (point: Point): Promise<FoundPlace[]> => {
      const response = await request(`${MAP_NEAR_PATH}?at=${point.lat},${point.lng}`);
      return placeSearchSchema.parse(await response.json()).places;
    },
    // The district and the name of a point under the pin (G24, docs/69).
    where: async (point: Point): Promise<Where> => {
      const response = await request(`${MAP_WHERE_PATH}?at=${point.lat},${point.lng}`);
      return whereSchema.parse(await response.json());
    },
  };
}

export type MapClient = ReturnType<typeof createMapClient>;
