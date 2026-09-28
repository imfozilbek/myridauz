import type { ImageStore, StoredImage } from './image-store';

// In memory: tests and local runs without R2.
export function createMemoryImages(): ImageStore & { readonly keys: () => string[] } {
  const images = new Map<string, StoredImage>();
  return {
    put: async (key, body, type) => void images.set(key, { body, type }),
    get: async (key) => images.get(key),
    delete: async (key) => void images.delete(key),
    keys: () => [...images.keys()],
  };
}
