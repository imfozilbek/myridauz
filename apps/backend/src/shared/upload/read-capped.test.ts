import { describe, expect, it } from 'vitest';
import { readCapped } from './read-capped';

const streamOf = (bytes: number, chunk = 1024) =>
  new Request('https://api.test/upload', {
    method: 'PUT',
    body: new ReadableStream({
      start(controller) {
        for (let sent = 0; sent < bytes; sent += chunk)
          controller.enqueue(new Uint8Array(Math.min(chunk, bytes - sent)));
        controller.close();
      },
    }),
    duplex: 'half',
  } as RequestInit);

// An upload is read only up to its limit, with or without content-length (G42, docs/111).
describe('a capped body', () => {
  it('reads a small body and stops a big one without content-length', async () => {
    expect((await readCapped(streamOf(500), 1000))?.byteLength).toBe(500);
    expect(await readCapped(streamOf(5000), 1000)).toBeNull();
    const lying = new Request('https://api.test/upload', {
      method: 'PUT',
      body: new Uint8Array(5000),
      headers: { 'content-length': '10' },
    });
    expect(await readCapped(lying, 1000)).toBeNull();
  });
});
