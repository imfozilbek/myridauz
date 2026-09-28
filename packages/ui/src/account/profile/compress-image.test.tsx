// Runs in the dom project: canvas needs a browser environment.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { compressImage } from './compress-image';

const drawImage = vi.fn();

function stubCanvas(sizes: number[]) {
  const image = { width: 1200, height: 900, close: vi.fn() };
  vi.stubGlobal(
    'createImageBitmap',
    vi.fn(async () => image),
  );
  const qualities: number[] = [];
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage } as never);
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (callback, _type, quality) {
    qualities.push(quality as number);
    const size = sizes.shift() ?? 1;
    callback(new Blob([new Uint8Array(size)], { type: 'image/jpeg' }));
  });
  return { image, qualities };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('compressImage', () => {
  it('cuts the middle square, scales it down and lowers quality until it is small', async () => {
    const { image, qualities } = stubCanvas([900, 500, 90]);
    const result = await compressImage(new Blob(['raw']), 100);
    expect(result.size).toBe(90);
    expect(qualities).toEqual([0.85, 0.75, 0.65]);
    expect(drawImage).toHaveBeenCalledWith(image, 150, 0, 900, 900, 0, 0, 800, 800);
    expect(image.close).toHaveBeenCalled();
  });

  it('returns the smallest try when no quality reaches the target', async () => {
    stubCanvas([900, 800, 700, 600, 500]);
    expect((await compressImage(new Blob(['raw']), 100)).size).toBe(500);
  });
});
