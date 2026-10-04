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

const BAD_REQUEST = 400;
// Longer names do not exist: the rest of a long search is cut, it never makes a new cache entry (G42).
export const MAX_QUERY_LENGTH = 60;

export type SearchDeps = {
  readonly index: PlaceIndex;
  readonly cache: MapCache;
  // The districts of a zone of a booking (G26), null for an unknown place.
  readonly districtsOf: (zone: string) => readonly string[] | null;
};

export function searchRoutes(deps: (env: Bindings) => SearchDeps) {
  return new Hono<AppEnv>().get(MAP_SEARCH_PATH, async (context) => {
    const query = (context.req.query('q') ?? '').slice(0, MAX_QUERY_LENGTH);
    const near = parsePoint(context.req.query('near'), NEAR_DIGITS);
    const { index, cache, districtsOf } = deps(context.env);
    const zone = context.req.query('zone') ?? null;
    const districts = zone === null ? null : districtsOf(zone);
    if (zone !== null && districts === null)
      return context.json({ error: 'locations.not_found' }, BAD_REQUEST);
    const where = near ? `${near.lat},${near.lng}` : '';
    const key = `search/${encodeURIComponent(searchKey(query))}/${where}/${zone ?? ''}`;
    const headers = { 'content-type': JSON_TYPE, 'cache-control': KEEP_ON_PHONE };
    const cached = await cache.match(key);
    if (cached) return context.body(cached.bytes, 200, headers);
    const places = await searchPlaces(index, query, near, districts);
    const bytes = await new Response(JSON.stringify({ places })).arrayBuffer();
    await cache.put(key, { bytes, offset: 0, size: bytes.byteLength, etag: '', type: JSON_TYPE });
    return context.body(bytes, 200, headers);
  });
}
