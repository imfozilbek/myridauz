import { MAP_FONTS, MAP_PATH } from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import type { MapDeps, MapPart } from '../application/ports';
import { readPart } from '../application/read-part';
import { parseRange } from '../domain/byte-range';

// A file name never changes its bytes: phones and the edge keep a part for a week.
const KEEP = 'public, max-age=604800, immutable';
const FONTS: readonly string[] = MAP_FONTS;

const partResponse = (part: MapPart, ranged: boolean) =>
  new Response(part.bytes, {
    status: ranged ? 206 : 200,
    headers: {
      'accept-ranges': 'bytes',
      'cache-control': KEEP,
      'content-type': part.type,
      etag: part.etag,
      ...(ranged
        ? { 'content-range': `bytes ${part.offset}-${part.offset + part.bytes.byteLength - 1}/${part.size}` }
        : {}),
    },
  });

// The map of the Mini App (G22, docs/67): the archive only by parts, the fonts of the labels whole.
// Public: OpenStreetMap data, nothing about people.
export function mapRoutes(deps: (env: Bindings) => MapDeps) {
  return new Hono<AppEnv>()
    .get(`${MAP_PATH}/:file{[a-z0-9-]+\\.pmtiles}`, async (context) => {
      const range = parseRange(context.req.header('range'));
      if (range === null || range === 'invalid') return context.body(null, 416);
      const part = await readPart(deps(context.env), `map/${context.req.param('file')}`, range);
      return part ? partResponse(part, true) : context.body(null, 404);
    })
    .get(`${MAP_PATH}/fonts/:stack/:range{[0-9]+-[0-9]+\\.pbf}`, async (context) => {
      const stack = context.req.param('stack');
      if (!FONTS.includes(stack)) return context.body(null, 404);
      const part = await readPart(
        deps(context.env),
        `map/fonts/${stack}/${context.req.param('range')}`,
        null,
      );
      return part ? partResponse(part, false) : context.body(null, 404);
    });
}
