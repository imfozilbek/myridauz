import { MAP_NEAR_PATH } from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { nearPlaces } from '../application/near-places';
import type { MapCache, PlaceIndex } from '../application/ports';
import { parsePoint } from './point-query';

// The known places around the pin (docs/126): three digits, about 110 m, one answer for a spot,
// kept at the edge and on the phone like the name of a point.
const POINT_DIGITS = 3;
const KEEP_ON_PHONE = 'private, max-age=3600';
const JSON_TYPE = 'application/json';
const BAD_REQUEST = 400;

export function nearRoutes(deps: (env: Bindings) => { readonly index: PlaceIndex; readonly cache: MapCache }) {
  return new Hono<AppEnv>().get(MAP_NEAR_PATH, async (context) => {
    const point = parsePoint(context.req.query('at'), POINT_DIGITS);
    if (!point) return context.json({ error: 'map.invalid_input' }, BAD_REQUEST);
    const { index, cache } = deps(context.env);
    const key = `near/${point.lat},${point.lng}`;
    const headers = { 'content-type': JSON_TYPE, 'cache-control': KEEP_ON_PHONE };
    const cached = await cache.match(key);
    if (cached) return context.body(cached.bytes, 200, headers);
    const bytes = await new Response(JSON.stringify({ places: await nearPlaces(index, point) })).arrayBuffer();
    await cache.put(key, { bytes, offset: 0, size: bytes.byteLength, etag: '', type: JSON_TYPE });
    return context.body(bytes, 200, headers);
  });
}
