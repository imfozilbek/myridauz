import { MAP_WHERE_PATH } from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { whereIs, type NameDeps } from '../application/point-name';
import type { MapCache } from '../application/ports';
import { parsePoint } from './point-query';

// The district and the name of a point (G24, docs/69): under the pin of the map, while a person
// moves it. Four digits, about 11 m: one spot is one answer, kept at the edge and on the phone.
const POINT_DIGITS = 4;
const KEEP_ON_PHONE = 'private, max-age=3600';
const JSON_TYPE = 'application/json';
const BAD_REQUEST = 400;

export type WhereDeps = NameDeps & { readonly cache: MapCache };

export function whereRoutes(deps: (env: Bindings) => WhereDeps) {
  return new Hono<AppEnv>().get(MAP_WHERE_PATH, async (context) => {
    const point = parsePoint(context.req.query('at'), POINT_DIGITS);
    if (!point) return context.json({ error: 'map.invalid_input' }, BAD_REQUEST);
    const own = deps(context.env);
    const key = `where/${point.lat},${point.lng}`;
    const headers = { 'content-type': JSON_TYPE, 'cache-control': KEEP_ON_PHONE };
    const cached = await own.cache.match(key);
    if (cached) return context.body(cached.bytes, 200, headers);
    const bytes = await new Response(JSON.stringify(await whereIs(own, point))).arrayBuffer();
    await own.cache.put(key, { bytes, offset: 0, size: bytes.byteLength, etag: '', type: JSON_TYPE });
    return context.body(bytes, 200, headers);
  });
}
