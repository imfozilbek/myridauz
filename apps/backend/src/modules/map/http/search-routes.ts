import { MAP_SEARCH_PATH, searchKey } from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import type { MapCache, PlaceIndex } from '../application/ports';
import { searchPlaces } from '../application/search-places';
import { parsePoint } from './point-query';

// The search of places by name (G23, docs/67): the same word near the same start is one answer,
// kept in the edge cache for a day and on the phone for an hour. The names are OpenStreetMap data.
const KEEP_ON_PHONE = 'private, max-age=3600';
const JSON_TYPE = 'application/json';
// Two digits, about a kilometre: people starting from one quarter share the cache.
const NEAR_DIGITS = 2;

export type SearchDeps = { readonly index: PlaceIndex; readonly cache: MapCache };

export function searchRoutes(deps: (env: Bindings) => SearchDeps) {
  return new Hono<AppEnv>().get(MAP_SEARCH_PATH, async (context) => {
    const query = context.req.query('q') ?? '';
    const near = parsePoint(context.req.query('near'), NEAR_DIGITS);
    const { index, cache } = deps(context.env);
    const key = `search/${encodeURIComponent(searchKey(query))}/${near ? `${near.lat},${near.lng}` : ''}`;
    const headers = { 'content-type': JSON_TYPE, 'cache-control': KEEP_ON_PHONE };
    const cached = await cache.match(key);
    if (cached) return context.body(cached.bytes, 200, headers);
    const places = await searchPlaces(index, query, near);
    const bytes = await new Response(JSON.stringify({ places })).arrayBuffer();
    await cache.put(key, { bytes, offset: 0, size: bytes.byteLength, etag: '', type: JSON_TYPE });
    return context.body(bytes, 200, headers);
  });
}
