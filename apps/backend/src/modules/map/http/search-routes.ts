import { MAP_SEARCH_PATH, searchKey, type Point } from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import type { MapCache, PlaceIndex } from '../application/ports';
import { searchPlaces } from '../application/search-places';

// The search of places by name (G23, docs/67): the same word near the same start is one answer,
// kept in the edge cache for a day and on the phone for an hour. The names are OpenStreetMap data.
const KEEP_ON_PHONE = 'private, max-age=3600';
const JSON_TYPE = 'application/json';
// Two digits, about a kilometre: people starting from one quarter share the cache.
const NEAR_DIGITS = 2;
const NEAR = /^(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)$/u;

export type SearchDeps = { readonly index: PlaceIndex; readonly cache: MapCache };

function parseNear(value: string | undefined): Point | null {
  const match = NEAR.exec(value ?? '');
  if (!match) return null;
  const [lat, lng] = [Number(match[1]), Number(match[2])];
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat: Number(lat.toFixed(NEAR_DIGITS)), lng: Number(lng.toFixed(NEAR_DIGITS)) };
}

export function searchRoutes(deps: (env: Bindings) => SearchDeps) {
  return new Hono<AppEnv>().get(MAP_SEARCH_PATH, async (context) => {
    const query = context.req.query('q') ?? '';
    const near = parseNear(context.req.query('near'));
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
