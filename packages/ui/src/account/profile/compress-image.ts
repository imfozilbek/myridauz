import { AVATAR_TARGET_BYTES } from '@platform/contracts';

// Photos are made small on the phone before upload (docs/05): about 200 KB.
// A face: a square from the middle. A car: the whole picture, the long side up to 1280 px.
const SHAPES = { square: { maxSide: 800 }, whole: { maxSide: 1280 } } as const;
const QUALITIES = [0.85, 0.75, 0.65, 0.55, 0.45];
const TYPE = 'image/jpeg';

const toBlob = (canvas: HTMLCanvasElement, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, TYPE, quality));

function crop(image: ImageBitmap, shape: keyof typeof SHAPES) {
  const { maxSide } = SHAPES[shape];
  if (shape === 'square') {
    const side = Math.min(image.width, image.height);
    const size = Math.min(side, maxSide);
    return {
      sx: (image.width - side) / 2,
      sy: (image.height - side) / 2,
      sw: side,
      sh: side,
      w: size,
      h: size,
    };
  }
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const w = Math.round(image.width * scale);
  const h = Math.round(image.height * scale);
  return { sx: 0, sy: 0, sw: image.width, sh: image.height, w, h };
}

export async function compressImage(
  file: Blob,
  shape: keyof typeof SHAPES = 'square',
  target = AVATAR_TARGET_BYTES,
): Promise<Blob> {
  const image = await createImageBitmap(file);
  const box = crop(image, shape);
  const canvas = document.createElement('canvas');
  canvas.width = box.w;
  canvas.height = box.h;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('ui.canvas_unavailable');
  context.drawImage(image, box.sx, box.sy, box.sw, box.sh, 0, 0, box.w, box.h);
  image.close();
  let smallest: Blob | null = null;
  for (const quality of QUALITIES) {
    smallest = await toBlob(canvas, quality);
    if (smallest && smallest.size <= target) return smallest;
  }
  if (!smallest) throw new Error('ui.image_encode_failed');
  return smallest;
}
