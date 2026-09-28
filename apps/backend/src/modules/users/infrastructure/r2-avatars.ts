import type { AvatarStore } from '../application/ports';

// Avatars in the private R2 bucket (docs/05). The bucket has no public access.
export const r2Avatars = (bucket: R2Bucket): AvatarStore => ({
  put: async (key, body, type) => {
    await bucket.put(key, body, { httpMetadata: { contentType: type } });
  },
  get: async (key) => {
    const object = await bucket.get(key);
    return object ? { body: object.body, type: object.httpMetadata?.contentType ?? 'image/jpeg' } : undefined;
  },
  delete: (key) => bucket.delete(key),
});
