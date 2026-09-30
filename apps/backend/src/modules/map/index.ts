import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../env';
import { mapRoutes } from './http/map-routes';
import { searchRoutes } from './http/search-routes';
import { whereRoutes } from './http/where-routes';
import { whereIs } from './application/point-name';
import { d1PlaceIndex } from './infrastructure/d1-place-index';
import { districtBorders } from './infrastructure/district-borders';
import { districtName, regionOfDistrict } from './infrastructure/district-names';
import { districtAt } from './domain/borders';
import type { Point } from '@platform/contracts';
import { edgeCache } from './infrastructure/edge-cache';
import { localMapFiles, noCache } from './infrastructure/memory-map-files';
import { memoryPlaceIndex } from './infrastructure/memory-place-index';
import type { PlaceRow } from './infrastructure/place-rows';
import { r2MapFiles } from './infrastructure/r2-map-files';

// Without D1 (tests) the search index is empty until a test fills it.
export const localPlaces: PlaceRow[] = [];
const cacheOf = () => (typeof caches === 'undefined' ? noCache : edgeCache(caches.default));
const indexOf = (env: Bindings) => (env.DB ? d1PlaceIndex(env.DB) : memoryPlaceIndex(localPlaces));

// The map of the Mini App (G22), its search by name (G23) and the name of a point (G24): R2, D1,
// the edge cache and the borders of districts on Cloudflare, memory in tests.
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
    searchRoutes((env: Bindings) => ({ index: indexOf(env), cache: cacheOf() })),
  )
  .route(
    '/',
    whereRoutes((env: Bindings) => ({
      index: indexOf(env),
      cache: cacheOf(),
      borders: districtBorders(),
      districtName,
    })),
  );
export { localMapFiles };

// The district and the region of a point by the borders (G24): null abroad.
export const districtOf = (point: Point) => districtAt(districtBorders(), point);
export const regionOf = (point: Point) => {
  const district = districtOf(point);
  return district === null ? null : (regionOfDistrict(district) ?? null);
};
// The name of a point and its area (docs/69) for a booking.
export const describePoint = (env: Bindings, point: Point) =>
  whereIs({ index: indexOf(env), borders: districtBorders(), districtName }, point);
export { isRegionId } from './infrastructure/district-names';
