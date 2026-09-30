import { MAP_ARCHIVE, MAP_FONTS_PATH, MAP_PATH } from '@platform/contracts';

// Where the map library reads the map of the Mini App (G22, docs/67): public, no signature.
export function createMapClient({ baseUrl }: { readonly baseUrl: string }) {
  const base = baseUrl.replace(/\/$/u, '');
  return {
    archiveUrl: `${base}${MAP_PATH}/${MAP_ARCHIVE}`,
    // The map library fills in {fontstack} and {range} itself.
    fontsUrl: `${base}${MAP_FONTS_PATH}/{fontstack}/{range}.pbf`,
  };
}

export type MapClient = ReturnType<typeof createMapClient>;
