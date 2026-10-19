// The drawing of a Telegram story picture (docs/88 L19, docs/123): a filled box, a line that gets
// smaller until it fits, a line of text.
export type Paint = CanvasRenderingContext2D;

export const box = (paint: Paint, x: number, y: number, width: number, height: number, radius: number) => {
  paint.beginPath();
  paint.roundRect(x, y, width, height, radius);
  paint.fill();
};

// A long name gets smaller until it fits: «Qoraqalpogʻiston Respublikasi» stays on one line.
export const fitted = (
  paint: Paint,
  text: string,
  weight: number,
  size: number,
  maxWidth: number,
  font: string,
) => {
  let current = size;
  paint.font = `${weight} ${current}px ${font}`;
  while (paint.measureText(text).width > maxWidth && current > size / 2) {
    current -= 2;
    paint.font = `${weight} ${current}px ${font}`;
  }
};

export const write = (
  paint: Paint,
  text: string,
  x: number,
  y: number,
  color: string,
  align: CanvasTextAlign,
) => {
  paint.fillStyle = color;
  paint.textAlign = align;
  paint.fillText(text, x, y);
};

// The font of a picture: the system font of the phone, as TelegramUI and the splash have it (docs/19).
// The body of the page has none of its own: a canvas given its font draws with serifs (G88).
export const PICTURE_FONT =
  'system-ui, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif';

// A Telegram story is 1080 × 1920; null: the browser cannot draw (no canvas), the button stays hidden.
export const STORY = { width: 1080, height: 1920 } as const;
const JPEG_QUALITY = 0.9;

export function storyCanvas(
  width: number = STORY.width,
  height: number = STORY.height,
): { readonly canvas: HTMLCanvasElement; readonly paint: Paint } | null {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const paint = canvas.getContext('2d');
  return paint ? { canvas, paint } : null;
}

export const storyJpeg = (canvas: HTMLCanvasElement): Promise<Blob | null> =>
  new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
