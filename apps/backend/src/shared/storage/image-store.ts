// Port: private photos (avatars, car photos). R2 in production, memory in tests (docs/05, docs/30).
export type StoredImage = { readonly body: ReadableStream | ArrayBuffer; readonly type: string };

export type ImageStore = {
  put(key: string, body: ArrayBuffer, type: string): Promise<void>;
  get(key: string): Promise<StoredImage | undefined>;
  delete(key: string): Promise<void>;
};
