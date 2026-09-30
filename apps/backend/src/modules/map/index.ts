import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../env';
import { mapRoutes } from './http/map-routes';
import { searchRoutes } from './http/search-routes';
import { d1PlaceIndex } from './infrastructure/d1-place-index';
import { edgeCache } from './infrastructure/edge-cache';
import { localMapFiles, noCache } from './infrastructure/memory-map-files';
import { memoryPlaceIndex } from './infrastructure/memory-place-index';
import type { PlaceRow } from './infrastructure/place-rows';
import { r2MapFiles } from './infrastructure/r2-map-files';

// Without D1 (tests) the search index is empty until a test fills it.
export const localPlaces: PlaceRow[] = [];
const cacheOf = () => (typeof caches === 'undefined' ? noCache : edgeCache(caches.default));

// The map of the Mini App (G22) and its search by name (G23): R2, D1 and the edge cache on
// Cloudflare, memory in tests.
export const mapModule = new Hono<AppEnv>()
  .route(
    '/',
    mapRoutes((env: Bindings) => ({
      files: env.MEDIA ? r2MapFiles(env.MEDIA) : localMapFiles,
      cache: cacheOf(),
    })),
  )
  .route(
    '/',
    searchRoutes((env: Bindings) => ({
      index: env.DB ? d1PlaceIndex(env.DB) : memoryPlaceIndex(localPlaces),
      cache: cacheOf(),
    })),
  );
export { localMapFiles };
