// The body of an upload, read only up to max bytes (G42, docs/111): a body without content-length,
// or with a wrong one, is never read whole into memory. null: the body is bigger than max.
export async function readCapped(request: Request, max: number): Promise<ArrayBuffer | null> {
  if (Number(request.headers.get('content-length') ?? 0) > max) return null;
  if (!request.body) return new ArrayBuffer(0);
  const reader = request.body.getReader();
  const parts: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel();
      return null;
    }
    parts.push(value);
  }
  const whole = new Uint8Array(size);
  let at = 0;
  for (const part of parts) {
    whole.set(part, at);
    at += part.byteLength;
  }
  return whole.buffer;
}
