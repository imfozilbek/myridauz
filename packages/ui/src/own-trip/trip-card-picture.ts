import type { BrandColors } from '@platform/brands';
import { drawCheckRow, drawMark } from '../media/brand-paint';
import { box, fitted, storyCanvas, storyJpeg, write } from '../media/story-paint';
import { drawFacts, drawRoad, drawStop, type TripPictureTexts } from '../media/trip-paint';

// The picture above the card of the driver's trip in a chat (G88, docs/193). A phone shows it about
// 300 points wide: a square with big words, no drawn button (the real one is under the picture).
const SIZE = 1080;
const MARGIN = 64;
const MARK = 104;
const CARD = { x: MARGIN, y: 224, width: SIZE - 2 * MARGIN, height: 720, radius: 48 };
const INSIDE = { left: CARD.x + 56, right: CARD.x + CARD.width - 56 };
const STOP_SCALE = 1.15;
const FACTS_SCALE = 1.1;

// null: the browser cannot draw (no canvas): the card goes without a picture.
export async function drawTripCardPicture(
  texts: TripPictureTexts,
  colors: BrandColors,
  font: string,
): Promise<Blob | null> {
  const drawn = storyCanvas(SIZE, SIZE);
  if (!drawn) return null;
  const { canvas, paint } = drawn;
  paint.fillStyle = colors.brandStrong;
  paint.fillRect(0, 0, SIZE, SIZE);
  drawMark(paint, MARGIN, MARGIN, MARK, texts.brandName.charAt(0), colors.bg, colors.brandStrong, font);
  const titleLeft = MARGIN + MARK + 28;
  fitted(paint, texts.title, 800, 92, SIZE - MARGIN - titleLeft, font);
  write(paint, texts.title, titleLeft, MARGIN + 84, colors.bg, 'left');
  const top = CARD.y;
  paint.fillStyle = colors.bg;
  box(paint, CARD.x, top, CARD.width, CARD.height, CARD.radius);
  drawStop(paint, texts.from, { ...INSIDE, y: top + 130 }, STOP_SCALE, colors.brandStrong, colors, font);
  drawRoad(paint, INSIDE.left, top + 225, top + 315, STOP_SCALE, colors.brandStrong);
  drawStop(paint, texts.to, { ...INSIDE, y: top + 400 }, STOP_SCALE, colors.accent, colors, font);
  paint.fillStyle = colors.bgGrouped;
  paint.fillRect(INSIDE.left, top + 504, INSIDE.right - INSIDE.left, 4);
  drawFacts(paint, texts, { ...INSIDE, when: top + 586, seats: top + 676 }, FACTS_SCALE, colors, font);
  const checks = { x: SIZE / 2, y: SIZE - MARGIN + 2, size: 44, color: colors.bg, mark: colors.brandStrong };
  drawCheckRow(paint, texts.checks, checks, font);
  return storyJpeg(canvas);
}
