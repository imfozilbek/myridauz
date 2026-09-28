import { AVATAR_TARGET_BYTES } from '@platform/contracts';

// The photo is made small on the phone before upload (docs/05): a square, about 200 KB.
const MAX_SIDE = 800;
const QUALITIES = [0.85, 0.75, 0.65, 0.55, 0.45];
const TYPE = 'image/jpeg';

const toBlob = (canvas: HTMLCanvasElement, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, TYPE, quality));

export async function compressImage(file: Blob, target = AVATAR_TARGET_BYTES): Promise<Blob> {
  const image = await createImageBitmap(file);
  const side = Math.min(image.width, image.height);
  const size = Math.min(side, MAX_SIDE);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('ui.canvas_unavailable');
  // The middle of the picture: a face is usually there.
  context.drawImage(image, (image.width - side) / 2, (image.height - side) / 2, side, side, 0, 0, size, size);
  image.close();
  let smallest: Blob | null = null;
  for (const quality of QUALITIES) {
    smallest = await toBlob(canvas, quality);
    if (smallest && smallest.size <= target) return smallest;
  }
  if (!smallest) throw new Error('ui.image_encode_failed');
  return smallest;
}
