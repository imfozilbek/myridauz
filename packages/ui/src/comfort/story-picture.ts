import type { BrandColors } from '@platform/brands';
import { fitted, STORY, storyCanvas, storyJpeg, write } from '../media/story-paint';
import { drawChecks, drawMark, drawTripCard, type TripPictureTexts } from '../media/trip-paint';

// The picture of a story (docs/88 L19), drawn like the story of the brand kit (docs/38): the brand
// color, the white card of the trip, the lines of value of the flyer (G88, docs/193) and the logo.
// The top and the bottom stay calm: Telegram puts its own lines there.
const WIDTH = STORY.width;
const CARD = { x: 90, y: 340, height: 1120 };
const MARK = 96;

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
  write(paint, texts.title, WIDTH / 2, 270, colors.bg, 'center');
  drawTripCard(paint, texts, CARD, 1, colors, font);
  const below = CARD.y + CARD.height;
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
  drawMark(
    paint,
    (WIDTH - MARK) / 2,
    below + 210,
    MARK,
    texts.brandName.charAt(0),
    colors.bg,
    colors.brandStrong,
    font,
  );
  paint.font = `600 56px ${font}`;
  write(paint, texts.slogan, WIDTH / 2, below + 370, colors.bg, 'center');
  return storyJpeg(canvas);
}
