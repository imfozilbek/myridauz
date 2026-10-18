import type { BrandColors } from '@platform/brands';
import { fitted, storyCanvas, storyJpeg, write } from '../media/story-paint';
import { drawChecks, drawMark, drawTripCard, type TripPictureTexts } from '../media/trip-paint';

// The picture above the card of the driver's trip in a chat (G88, docs/193), 16 : 9 like the ads of
// the brand: on the left the brand, «Boʻsh joy bor» and the lines of value of the flyer, on the right
// the white card of the trip, the same as in the story.
const SIZE = { width: 1280, height: 720 };
const SCALE = 0.56;
const MARGIN = 56;
const CARD = { x: SIZE.width - MARGIN - 900 * SCALE, y: (SIZE.height - 1120 * SCALE) / 2 };
const TEXT_WIDTH = CARD.x - 2 * MARGIN;
const MARK = 84;

// null: the browser cannot draw (no canvas): the card goes without a picture.
export async function drawTripCardPicture(
  texts: TripPictureTexts,
  colors: BrandColors,
  font: string,
): Promise<Blob | null> {
  const drawn = storyCanvas(SIZE.width, SIZE.height);
  if (!drawn) return null;
  const { canvas, paint } = drawn;
  paint.fillStyle = colors.brandStrong;
  paint.fillRect(0, 0, SIZE.width, SIZE.height);
  drawMark(paint, MARGIN, MARGIN, MARK, texts.brandName.charAt(0), colors.bg, colors.brandStrong, font);
  paint.font = `800 48px ${font}`;
  write(paint, texts.brandName, MARGIN + MARK + 20, MARGIN + 60, colors.bg, 'left');
  fitted(paint, texts.title, 800, 92, TEXT_WIDTH, font);
  write(paint, texts.title, MARGIN, 310, colors.bg, 'left');
  const checks = {
    x: MARGIN,
    y: 430,
    size: 38,
    line: 64,
    align: 'left',
    color: colors.bg,
    mark: colors.brandStrong,
  } as const;
  drawChecks(paint, texts.checks, checks, font);
  paint.font = `600 34px ${font}`;
  write(paint, texts.slogan, MARGIN, SIZE.height - MARGIN, colors.bg, 'left');
  drawTripCard(paint, texts, CARD, SCALE, colors, font);
  return storyJpeg(canvas);
}
