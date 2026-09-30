import { appHost, loadBrand } from '@platform/brands';
import { MAP_ARCHIVE } from '@platform/contracts';
import { describe, expect, it, vi } from 'vitest';
import { parseRange } from './modules/map/domain/byte-range';
import { readPart } from './modules/map/application/read-part';
import type { MapPart } from './modules/map/application/ports';
import { edgeCache } from './modules/map/infrastructure/edge-cache';
import { localMapFiles } from './modules/map';
import { app } from './app';
import { testEnv } from './test-api';

const ARCHIVE = new Uint8Array(1000).map((_, index) => index % 251);
localMapFiles.put(`map/${MAP_ARCHIVE}`, ARCHIVE, 'application/octet-stream');
localMapFiles.put(
  'map/fonts/Noto Sans Regular/0-255.pbf',
  new Uint8Array([1, 2, 3]),
  'application/x-protobuf',
);
const PASSENGER_APP = `https://${appHost(loadBrand(), 'passenger')}`;
const get = (path: string, headers: Record<string, string> = {}) =>
  app.request(path, { headers: { origin: PASSENGER_APP, ...headers } }, testEnv);

describe('the map files of the Mini App (G22)', () => {
  it('gives a part of the archive with its place in the file, for the Mini Apps only', async () => {
    const part = await get(`/map/${MAP_ARCHIVE}`, { range: 'bytes=10-19' });
    expect(part.status).toBe(206);
    expect(part.headers.get('content-range')).toBe('bytes 10-19/1000');
    expect(part.headers.get('access-control-allow-origin')).toBe(PASSENGER_APP);
    expect(part.headers.get('access-control-expose-headers')).toContain('content-range');
    expect(part.headers.get('cache-control')).toContain('immutable');
    expect([...new Uint8Array(await part.arrayBuffer())]).toEqual([...ARCHIVE.slice(10, 20)]);
    const stranger = await get(`/map/${MAP_ARCHIVE}`, { range: 'bytes=0-9', origin: 'https://evil.test' });
    expect(stranger.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('never reads the whole archive or a strange file', async () => {
    expect((await get(`/map/${MAP_ARCHIVE}`)).status).toBe(416);
    expect((await get(`/map/${MAP_ARCHIVE}`, { range: 'bytes=0-99999999' })).status).toBe(416);
    expect((await get('/map/other.pmtiles', { range: 'bytes=0-9' })).status).toBe(404);
    expect((await get(`/map/${MAP_ARCHIVE}`, { range: 'bytes=5000-5009' })).status).toBe(404);
    expect((await get('/map/..%2Fsecret.pmtiles', { range: 'bytes=0-9' })).status).toBe(404);
  });

  it('gives the fonts of the labels, only the known ones', async () => {
    const font = await get('/map/fonts/Noto%20Sans%20Regular/0-255.pbf');
    expect(font.status).toBe(200);
    expect([...new Uint8Array(await font.arrayBuffer())]).toEqual([1, 2, 3]);
    expect((await get('/map/fonts/Other/0-255.pbf')).status).toBe(404);
    expect((await get('/map/fonts/Noto%20Sans%20Medium/0-255.pbf')).status).toBe(404);
  });

  it('reads a range header', () => {
    expect(parseRange('bytes=0-16383')).toEqual({ offset: 0, length: 16384 });
    expect(parseRange(undefined)).toBeNull();
    expect(parseRange('bytes=10-5')).toBe('invalid');
    expect(parseRange('bytes=0-')).toBe('invalid');
    expect(parseRange('bytes=0-1,5-6')).toBe('invalid');
  });

  it('keeps a part in the edge cache with its place in the file', async () => {
    const kept = new Map<string, Response>();
    const cache = edgeCache({
      match: async (key: RequestInfo | URL) => kept.get(String(key))?.clone(),
      put: async (key: RequestInfo | URL, response: Response) => void kept.set(String(key), response),
    } as unknown as Cache);
    expect(await cache.match('a')).toBeNull();
    await cache.put('a', {
      bytes: new Uint8Array([7, 8]).buffer,
      offset: 4,
      size: 9,
      etag: '"e"',
      type: 't',
    });
    const part = await cache.match('a');
    expect(part && { ...part, bytes: [...new Uint8Array(part.bytes)] }).toEqual({
      bytes: [7, 8],
      offset: 4,
      size: 9,
      etag: '"e"',
      type: 't',
    });
  });

  it('reads a part from R2 once, then from the edge cache', async () => {
    const kept = new Map<string, MapPart>();
    const read = vi.spyOn(localMapFiles, 'read');
    const deps = {
      files: localMapFiles,
      cache: {
        match: async (key: string) => kept.get(key) ?? null,
        put: async (key: string, part: MapPart) => void kept.set(key, part),
      },
    };
    const range = { offset: 0, length: 4 };
    const first = await readPart(deps, `map/${MAP_ARCHIVE}`, range);
    const second = await readPart(deps, `map/${MAP_ARCHIVE}`, range);
    expect(second).toBe(first);
    expect(read).toHaveBeenCalledTimes(1);
    expect([...kept.keys()]).toEqual([`map/${MAP_ARCHIVE}?bytes=0-3`]);
  });
});
