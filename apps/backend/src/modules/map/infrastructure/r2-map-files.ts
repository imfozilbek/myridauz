import type { MapFiles } from '../application/ports';

// The map files in the private bucket (docs/46): R2 reads exactly the bytes asked for.
export const r2MapFiles = (bucket: R2Bucket): MapFiles => ({
  read: async (key, range) => {
    // A part past the end of the file is not there: R2 refuses such a range.
    const object = await bucket.get(key, range ? { range } : {}).catch(() => null);
    if (!object) return null;
    return {
      bytes: await object.arrayBuffer(),
      offset: range?.offset ?? 0,
      size: object.size,
      etag: object.httpEtag,
      type: object.httpMetadata?.contentType ?? 'application/octet-stream',
    };
  },
});
