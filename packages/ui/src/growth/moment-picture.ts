import type { BrandColors } from '@platform/brands';
import { box, fitted, STORY, storyCanvas, storyJpeg, write, type Paint } from '../media/story-paint';

// The words of the story of a moment (docs/123): only text, no emoji (owner decision 06.10.2026).
export type MomentStoryTexts = {
  readonly brandName: string;
  readonly initial: string;
  readonly quote: string;
  readonly who: string;
  readonly fact: string;
  readonly link: string;
  readonly slogan: string;
};

const CENTER = STORY.width / 2;
const CARD = { x: 90, y: 300, width: 900, height: 1180, radius: 50 };
const TEXT_WIDTH = 760;
const QUOTE = { size: 76, line: 92, top: 860, lines: 4 };

// The quote in at most four lines of whole words, centred.
function quoteLines(paint: Paint, quote: string, font: string): string[] {
  paint.font = `800 ${QUOTE.size}px ${font}`;
  const lines: string[] = [];
  for (const word of quote.split(' ')) {
    const last = lines.at(-1);
    if (last !== undefined && paint.measureText(`${last} ${word}`).width <= TEXT_WIDTH)
      lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  return lines.slice(0, QUOTE.lines);
}

function drawCard(paint: Paint, texts: MomentStoryTexts, main: string, colors: BrandColors, font: string) {
  paint.fillStyle = colors.bg;
  box(paint, CARD.x, CARD.y, CARD.width, CARD.height, CARD.radius);
  paint.fillStyle = main;
  box(paint, 150, 360, 72, 72, 18);
  paint.font = `900 52px ${font}`;
  write(paint, texts.brandName.charAt(0).toUpperCase(), 186, 415, colors.bg, 'center');
  paint.font = `800 48px ${font}`;
  write(paint, texts.brandName, 246, 414, main, 'left');
  paint.fillStyle = colors.bgGrouped;
  paint.beginPath();
  paint.arc(CENTER, 620, 110, 0, Math.PI * 2);
  paint.fill();
  paint.font = `800 110px ${font}`;
  write(paint, texts.initial, CENTER, 660, main, 'center');
  const lines = quoteLines(paint, texts.quote, font);
  lines.forEach((line, index) =>
    write(paint, line, CENTER, QUOTE.top + index * QUOTE.line, colors.text, 'center'),
  );
  const below = QUOTE.top + lines.length * QUOTE.line + 20;
  fitted(paint, texts.who, 600, 48, TEXT_WIDTH, font);
  write(paint, texts.who, CENTER, below, colors.textMuted, 'center');
  fitted(paint, texts.fact, 700, 48, TEXT_WIDTH, font);
  write(paint, texts.fact, CENTER, below + 80, main, 'center');
  paint.fillStyle = main;
  box(paint, 150, 1310, 780, 120, 36);
  fitted(paint, texts.link, 800, 56, 700, font);
  write(paint, texts.link, CENTER, 1390, colors.bg, 'center');
}

// The card of «Men Rida bilan» as a story: the main color of the app (the passenger teal, the driver
// amber, docs/20), the white card of the screen, the slogan under it. null: the browser cannot draw.
export async function drawMomentStory(
  texts: MomentStoryTexts,
  colors: BrandColors,
  font: string,
): Promise<Blob | null> {
  const drawn = storyCanvas();
  if (!drawn) return null;
  const { canvas, paint } = drawn;
  const main = colors.brandStrong;
  paint.fillStyle = main;
  paint.fillRect(0, 0, STORY.width, STORY.height);
  drawCard(paint, texts, main, colors, font);
  paint.font = `600 56px ${font}`;
  write(paint, texts.slogan, CENTER, 1640, colors.bg, 'center');
  return storyJpeg(canvas);
}
