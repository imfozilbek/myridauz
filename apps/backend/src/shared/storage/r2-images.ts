import type { ImageStore } from './image-store';

// Photos in the private R2 bucket. The bucket has no public access: the API checks who may see a photo.
export const r2Images = (bucket: R2Bucket): ImageStore => ({
  put: async (key, body, type) => {
    await bucket.put(key, body, { httpMetadata: { contentType: type } });
  },
  get: async (key) => {
    const object = await bucket.get(key);
    return object ? { body: object.body, type: object.httpMetadata?.contentType ?? 'image/jpeg' } : undefined;
  },
  delete: (key) => bucket.delete(key),
});
