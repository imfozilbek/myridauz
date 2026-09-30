import { mapRoutes } from './http/map-routes';
import { edgeCache } from './infrastructure/edge-cache';
import { localMapFiles, noCache } from './infrastructure/memory-map-files';
import { r2MapFiles } from './infrastructure/r2-map-files';

// The map of the Mini App (G22): R2 and the edge cache on Cloudflare, memory in tests.
export const mapModule = mapRoutes((env) => ({
  files: env.MEDIA ? r2MapFiles(env.MEDIA) : localMapFiles,
  cache: typeof caches === 'undefined' ? noCache : edgeCache(caches.default),
}));
export { localMapFiles };
