import type { BrandColors } from '@platform/brands';
import { drawChecks, drawMark } from '../media/brand-paint';
import { box, fitted, STORY, storyCanvas, storyJpeg, write, type Paint } from '../media/story-paint';

// The words of the story of a moment (docs/123): only text, no emoji (owner decision 06.10.2026).
export type MomentStoryTexts = {
  readonly brandName: string;
  readonly initial: string;
  readonly quote: string;
  readonly name: string;
  readonly fact: string;
  readonly link: string;
  readonly slogan: string;
  // The lines of value of the flyer under the card (G88, docs/193).
  readonly checks: readonly string[];
};

const CENTER = STORY.width / 2;
// The card grows with the quote: the button right under the words, the bottom of the story calm.
const CARD = { x: 90, y: 260, width: 900, radius: 50 };
const TEXT_WIDTH = 760;
const QUOTE = { size: 76, line: 92, top: CARD.y + 560, lines: 4 };
const BUTTON = { left: 150, width: 780, height: 120, gap: 70, after: 60 };

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

// The words of the card over its white box; the bottom of the card.
function drawCard(paint: Paint, texts: MomentStoryTexts, main: string, colors: BrandColors, font: string) {
  const top = CARD.y;
  const lines = quoteLines(paint, texts.quote, font);
  const below = QUOTE.top + lines.length * QUOTE.line + 20;
  const button = below + 80 + BUTTON.gap;
  const bottom = button + BUTTON.height + BUTTON.after;
  paint.fillStyle = colors.bg;
  box(paint, CARD.x, top, CARD.width, bottom - top, CARD.radius);
  drawMark(paint, 150, top + 60, 72, texts.brandName.charAt(0), main, colors.bg, font);
  paint.font = `800 48px ${font}`;
  write(paint, texts.brandName, 246, top + 114, main, 'left');
  paint.fillStyle = colors.bgGrouped;
  paint.beginPath();
  paint.arc(CENTER, top + 320, 110, 0, Math.PI * 2);
  paint.fill();
  paint.font = `800 110px ${font}`;
  write(paint, texts.initial, CENTER, top + 360, main, 'center');
  paint.font = `800 ${QUOTE.size}px ${font}`;
  lines.forEach((line, index) =>
    write(paint, line, CENTER, QUOTE.top + index * QUOTE.line, colors.text, 'center'),
  );
  fitted(paint, texts.name, 600, 48, TEXT_WIDTH, font);
  write(paint, texts.name, CENTER, below, colors.textMuted, 'center');
  fitted(paint, texts.fact, 700, 48, TEXT_WIDTH, font);
  write(paint, texts.fact, CENTER, below + 80, main, 'center');
  paint.fillStyle = main;
  box(paint, BUTTON.left, button, BUTTON.width, BUTTON.height, 36);
  fitted(paint, texts.link, 800, 56, BUTTON.width - 80, font);
  write(paint, texts.link, CENTER, button + 80, colors.bg, 'center');
  return bottom;
}

// The card of «Men Rida bilan» as a story: the main color of the app (the passenger teal, the driver
// amber, docs/20), the white card of the screen, the lines of value and the slogan under it. null: the
// browser cannot draw.
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
  const below = drawCard(paint, texts, main, colors, font);
  const checks = {
    x: CENTER,
    y: below + 85,
    size: 46,
    line: 66,
    align: 'center',
    color: colors.bg,
    mark: main,
  } as const;
  drawChecks(paint, texts.checks, checks, font);
  paint.font = `600 56px ${font}`;
  write(paint, texts.slogan, CENTER, below + 250, colors.bg, 'center');
  return storyJpeg(canvas);
}
