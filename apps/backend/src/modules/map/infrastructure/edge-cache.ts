import type { MapCache } from '../application/ports';

// The Cloudflare cache of this place of the network (G22, docs/61): it costs nothing and spares
// R2 reads. Keys are made up addresses: the cache keeps what it is given under them.
const ORIGIN = 'https://map-cache.internal/';
const DAY_SECONDS = 86_400;

export const edgeCache = (cache: Cache): MapCache => ({
  match: async (key) => {
    const found = await cache.match(ORIGIN + key);
    if (!found) return null;
    return {
      bytes: await found.arrayBuffer(),
      offset: Number(found.headers.get('x-offset') ?? 0),
      size: Number(found.headers.get('x-size') ?? 0),
      etag: found.headers.get('etag') ?? '',
      type: found.headers.get('content-type') ?? 'application/octet-stream',
    };
  },
  put: (key, part) =>
    cache.put(
      ORIGIN + key,
      new Response(part.bytes, {
        headers: {
          'cache-control': `public, max-age=${DAY_SECONDS}`,
          'content-type': part.type,
          etag: part.etag,
          'x-offset': String(part.offset),
          'x-size': String(part.size),
        },
      }),
    ),
});
