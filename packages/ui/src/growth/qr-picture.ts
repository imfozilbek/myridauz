import type { BrandColors } from '@platform/brands';
import { QR_TYPE } from '@platform/contracts';
import { encode, renderSVG } from 'uqr';
import { box, fitted, storyCanvas, write } from '../media/story-paint';

// The QR of a driver on the glass (docs/123 loop 1): medium error correction, it is read through glass.
const ECC = 'M';
const SIZE = { width: 1080, height: 1400 };
const QR = { x: 160, y: 300, size: 760 };

// The QR on the screen: the same code as the picture, in the dark brand color.
export const qrSvg = (link: string, colors: BrandColors) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    renderSVG(link, { ecc: ECC, border: 1, blackColor: colors.text, whiteColor: colors.bg }),
  )}`;

// The picture to print (PNG): the brand on top, the QR, «Skanerlang» under it. null: no canvas.
export async function drawQrPicture(
  link: string,
  texts: { readonly brandName: string; readonly caption: string },
  colors: BrandColors,
  font: string,
): Promise<Blob | null> {
  const drawn = storyCanvas(SIZE.width, SIZE.height);
  if (!drawn) return null;
  const { canvas, paint } = drawn;
  paint.fillStyle = colors.bg;
  paint.fillRect(0, 0, SIZE.width, SIZE.height);
  paint.fillStyle = colors.brandStrong;
  box(paint, 0, 0, SIZE.width, 220, 0);
  paint.font = `900 96px ${font}`;
  write(paint, texts.brandName, SIZE.width / 2, 145, colors.bg, 'center');
  const { data, size } = encode(link, { ecc: ECC, border: 0 });
  const cell = QR.size / size;
  paint.fillStyle = colors.text;
  data.forEach((row, y) =>
    row.forEach(
      (dark, x) => dark && paint.fillRect(QR.x + x * cell, QR.y + y * cell, cell + 0.5, cell + 0.5),
    ),
  );
  fitted(paint, texts.caption, 800, 60, SIZE.width - 120, font);
  write(paint, texts.caption, SIZE.width / 2, 1200, colors.brandStrong, 'center');
  return new Promise((resolve) => canvas.toBlob(resolve, QR_TYPE));
}
