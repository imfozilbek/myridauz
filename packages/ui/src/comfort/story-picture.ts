import type { BrandColors } from '@platform/brands';

// The picture of a story (docs/88 L19), drawn like the story of the brand kit (docs/38):
// the brand color, a white card with the route, the price and the logo.
export type StoryTexts = {
  readonly title: string;
  readonly from: { readonly name: string; readonly area: string };
  readonly to: { readonly name: string; readonly area: string };
  readonly when: string;
  readonly seats: string;
  readonly price: string;
  readonly button: string;
  readonly brandName: string;
  readonly slogan: string;
};

const WIDTH = 1080;
const HEIGHT = 1920;
const CARD = { x: 90, y: 380, width: 900, height: 1120, radius: 50 };
const INSIDE = { left: 150, right: 930, text: 262 };
const JPEG_QUALITY = 0.9;

type Paint = CanvasRenderingContext2D;

const box = (paint: Paint, x: number, y: number, width: number, height: number, radius: number) => {
  paint.beginPath();
  paint.roundRect(x, y, width, height, radius);
  paint.fill();
};

// A long name gets smaller until it fits: «Qoraqalpogʻiston Respublikasi» stays on one line.
const fitted = (paint: Paint, text: string, weight: number, size: number, maxWidth: number, font: string) => {
  let current = size;
  paint.font = `${weight} ${current}px ${font}`;
  while (paint.measureText(text).width > maxWidth && current > size / 2) {
    current -= 2;
    paint.font = `${weight} ${current}px ${font}`;
  }
};

const write = (paint: Paint, text: string, x: number, y: number, color: string, align: CanvasTextAlign) => {
  paint.fillStyle = color;
  paint.textAlign = align;
  paint.fillText(text, x, y);
};

function drawStop(
  paint: Paint,
  stop: StoryTexts['from'],
  y: number,
  dot: string,
  colors: BrandColors,
  font: string,
) {
  paint.fillStyle = dot;
  paint.beginPath();
  paint.arc(INSIDE.left + 50, y - 25, 26, 0, Math.PI * 2);
  paint.fill();
  fitted(paint, stop.name, 800, 72, INSIDE.right - INSIDE.text, font);
  write(paint, stop.name, INSIDE.text, y, colors.text, 'left');
  fitted(paint, stop.area, 500, 44, INSIDE.right - INSIDE.text, font);
  write(paint, stop.area, INSIDE.text, y + 60, colors.textMuted, 'left');
}

function drawCard(paint: Paint, texts: StoryTexts, colors: BrandColors, font: string) {
  paint.fillStyle = colors.bg;
  box(paint, CARD.x, CARD.y, CARD.width, CARD.height, CARD.radius);
  drawStop(paint, texts.from, 545, colors.brandStrong, colors, font);
  paint.strokeStyle = colors.brandStrong;
  paint.lineWidth = 12;
  paint.lineCap = 'round';
  paint.setLineDash([2, 36]);
  paint.beginPath();
  paint.moveTo(INSIDE.left + 50, 640);
  paint.lineTo(INSIDE.left + 50, 820);
  paint.stroke();
  paint.setLineDash([]);
  drawStop(paint, texts.to, 905, colors.accent, colors, font);
  paint.fillStyle = colors.bgGrouped;
  paint.fillRect(INSIDE.left, 1030, INSIDE.right - INSIDE.left, 4);
  fitted(paint, texts.when, 600, 60, INSIDE.right - INSIDE.left, font);
  write(paint, texts.when, INSIDE.left, 1120, colors.textMuted, 'left');
  paint.font = `600 60px ${font}`;
  write(paint, texts.seats, INSIDE.left, 1210, colors.textMuted, 'left');
  paint.font = `800 76px ${font}`;
  write(paint, texts.price, INSIDE.right, 1210, colors.brandStrong, 'right');
  paint.fillStyle = colors.brandStrong;
  box(paint, INSIDE.left, 1290, INSIDE.right - INSIDE.left, 130, 36);
  paint.font = `800 64px ${font}`;
  write(paint, texts.button, WIDTH / 2, 1378, colors.bg, 'center');
}

// null: the browser cannot draw (no canvas), the button stays hidden.
export async function drawStory(texts: StoryTexts, colors: BrandColors, font: string): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const paint = canvas.getContext('2d');
  if (!paint) return null;
  paint.fillStyle = colors.brandStrong;
  paint.fillRect(0, 0, WIDTH, HEIGHT);
  paint.font = `800 110px ${font}`;
  write(paint, texts.title, WIDTH / 2, 290, colors.bg, 'center');
  drawCard(paint, texts, colors, font);
  paint.fillStyle = colors.bg;
  box(paint, 480, 1600, 120, 120, 28);
  paint.font = `900 96px ${font}`;
  write(paint, texts.brandName.charAt(0).toUpperCase(), WIDTH / 2, 1695, colors.brandStrong, 'center');
  paint.font = `600 56px ${font}`;
  write(paint, texts.slogan, WIDTH / 2, 1830, colors.bg, 'center');
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
}
