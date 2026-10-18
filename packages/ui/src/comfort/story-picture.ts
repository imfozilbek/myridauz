import type { BrandColors } from '@platform/brands';
import { drawChecks, drawMark } from '../media/brand-paint';
import { fitted, STORY, storyCanvas, storyJpeg, write, type Paint } from '../media/story-paint';
import { drawTripCard, TRIP_CARD, type TripPictureTexts } from '../media/trip-paint';

// The picture of a story (docs/88 L19), drawn like the story of the brand kit (docs/38): the brand
// color, the white card of the trip, the lines of value of the flyer (G88, docs/193) and the logo.
// The top and the bottom 250 px stay calm: Telegram puts its own lines and the answer field there.
const WIDTH = STORY.width;
const CARD = { x: 90, y: 380 };
const MARK = 80;
const MARK_GAP = 24;
const SLOGAN = 48;

// The logo tile and the slogan on one line, centred.
function drawSign(paint: Paint, texts: TripPictureTexts, y: number, colors: BrandColors, font: string) {
  paint.font = `600 ${SLOGAN}px ${font}`;
  const left = (WIDTH - MARK - MARK_GAP - paint.measureText(texts.slogan).width) / 2;
  drawMark(paint, left, y, MARK, texts.brandName.charAt(0), colors.bg, colors.brandStrong, font);
  paint.font = `600 ${SLOGAN}px ${font}`;
  write(paint, texts.slogan, left + MARK + MARK_GAP, y + MARK * 0.68, colors.bg, 'left');
}

// null: the browser cannot draw (no canvas), the button stays hidden.
export async function drawStory(
  texts: TripPictureTexts,
  colors: BrandColors,
  font: string,
): Promise<Blob | null> {
  const drawn = storyCanvas();
  if (!drawn) return null;
  const { canvas, paint } = drawn;
  paint.fillStyle = colors.brandStrong;
  paint.fillRect(0, 0, WIDTH, STORY.height);
  fitted(paint, texts.title, 800, 110, WIDTH - 2 * CARD.x, font);
  write(paint, texts.title, WIDTH / 2, 300, colors.bg, 'center');
  drawTripCard(paint, texts, CARD, 1, colors, font);
  const below = CARD.y + TRIP_CARD.height;
  const checks = {
    x: WIDTH / 2,
    y: below + 80,
    size: 46,
    line: 66,
    align: 'center',
    color: colors.bg,
    mark: colors.brandStrong,
  } as const;
  drawChecks(paint, texts.checks, checks, font);
  drawSign(paint, texts, below + 200, colors, font);
  return storyJpeg(canvas);
}
