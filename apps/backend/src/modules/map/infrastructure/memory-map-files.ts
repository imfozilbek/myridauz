import type { MapCache, MapFiles, MapPart } from '../application/ports';

// Map files in memory, for tests and a local run without R2.
const files = new Map<string, { readonly bytes: Uint8Array; readonly type: string }>();

export const localMapFiles: MapFiles & { put(key: string, bytes: Uint8Array, type: string): void } = {
  put: (key, bytes, type) => void files.set(key, { bytes, type }),
  read: async (key, range) => {
    const file = files.get(key);
    if (!file || (range && range.offset >= file.bytes.length)) return null;
    const start = range?.offset ?? 0;
    const end = range ? Math.min(file.bytes.length, start + range.length) : file.bytes.length;
    const slice = file.bytes.slice(start, end);
    return { bytes: slice.buffer, offset: start, size: file.bytes.length, etag: `"${key}"`, type: file.type };
  },
};

// No edge cache outside Cloudflare: every read goes to the files.
export const noCache: MapCache = {
  match: async (): Promise<MapPart | null> => null,
  put: async () => undefined,
};
