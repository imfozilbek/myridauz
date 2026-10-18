import type { BrandColors } from '@platform/brands';
import { box, fitted, write, type Paint } from './story-paint';

// The parts of the pictures of a trip and of the brand (docs/88 L19, G88 docs/193), drawn at a scale:
// 1 is the story of 1080 × 1920; the chat card of a trip draws them smaller.
export type Stop = { readonly name: string; readonly area: string };
type Box = { readonly left: number; readonly right: number };

// The words of a picture of a trip: the route, the time, the seats and the price, the lines of value
// of the flyer. Never a name, a car or a phone.
export type TripPictureTexts = {
  readonly title: string;
  readonly from: Stop;
  readonly to: Stop;
  readonly when: string;
  readonly seats: string;
  readonly price: string;
  readonly button: string;
  readonly brandName: string;
  readonly slogan: string;
  readonly checks: readonly string[];
};

// One end of the route (docs/121): the dot in its color, the place in bold and its area under it.
function drawStop(
  paint: Paint,
  stop: Stop,
  at: Box & { readonly y: number },
  scale: number,
  dot: string,
  colors: BrandColors,
  font: string,
) {
  const text = at.left + 112 * scale;
  paint.fillStyle = dot;
  paint.beginPath();
  paint.arc(at.left + 50 * scale, at.y - 25 * scale, 26 * scale, 0, Math.PI * 2);
  paint.fill();
  fitted(paint, stop.name, 800, 72 * scale, at.right - text, font);
  write(paint, stop.name, text, at.y, colors.text, 'left');
  fitted(paint, stop.area, 500, 44 * scale, at.right - text, font);
  write(paint, stop.area, text, at.y + 60 * scale, colors.textMuted, 'left');
}

// The road between the two ends: a dotted line under the first dot.
function drawRoad(paint: Paint, left: number, from: number, to: number, scale: number, color: string) {
  paint.strokeStyle = color;
  paint.lineWidth = 12 * scale;
  paint.lineCap = 'round';
  paint.setLineDash([2 * scale, 36 * scale]);
  paint.beginPath();
  paint.moveTo(left + 50 * scale, from);
  paint.lineTo(left + 50 * scale, to);
  paint.stroke();
  paint.setLineDash([]);
}

// The tile of the brand: its first letter in a rounded square, as the logo of the brand kit (docs/36).
export function drawMark(
  paint: Paint,
  x: number,
  y: number,
  size: number,
  letter: string,
  tile: string,
  ink: string,
  font: string,
) {
  paint.fillStyle = tile;
  box(paint, x, y, size, size, size * 0.24);
  paint.font = `900 ${size * 0.8}px ${font}`;
  write(paint, letter.toUpperCase(), x + size / 2, y + size * 0.79, ink, 'center');
}

type Checks = {
  readonly x: number;
  readonly y: number;
  // The height of the words and the step to the next line.
  readonly size: number;
  readonly line: number;
  readonly align: 'left' | 'center';
  readonly color: string;
  readonly mark: string;
};

// The lines of value of the flyer under a picture (G88): a round check and the words, one per line;
// centred lines keep their checks in one column.
export function drawChecks(paint: Paint, items: readonly string[], at: Checks, font: string) {
  const radius = at.size * 0.55;
  const gap = at.size * 0.4;
  paint.font = `600 ${at.size}px ${font}`;
  const widest = Math.max(...items.map((item) => paint.measureText(item).width));
  const left = at.align === 'center' ? at.x - (2 * radius + gap + widest) / 2 : at.x;
  items.forEach((item, index) => {
    const middle = at.y + index * at.line - at.size * 0.35;
    paint.fillStyle = at.color;
    paint.beginPath();
    paint.arc(left + radius, middle, radius, 0, Math.PI * 2);
    paint.fill();
    paint.strokeStyle = at.mark;
    paint.lineWidth = radius * 0.28;
    paint.lineCap = 'round';
    paint.beginPath();
    paint.moveTo(left + radius * 0.55, middle);
    paint.lineTo(left + radius * 0.9, middle + radius * 0.35);
    paint.lineTo(left + radius * 1.5, middle - radius * 0.35);
    paint.stroke();
    write(paint, item, left + 2 * radius + gap, at.y + index * at.line, at.color, 'left');
  });
}

// The white card of a trip at its top left corner: both ends, the time, the seats and the price,
// «Joy band qilish» (docs/88 L19). At scale 1 it is 900 × 1120.
export function drawTripCard(
  paint: Paint,
  texts: TripPictureTexts,
  at: { readonly x: number; readonly y: number },
  scale: number,
  colors: BrandColors,
  font: string,
) {
  const s = (value: number) => value * scale;
  const left = at.x + s(60);
  const right = at.x + s(840);
  const top = at.y;
  paint.fillStyle = colors.bg;
  box(paint, at.x, top, s(900), s(1120), s(50));
  drawStop(paint, texts.from, { left, right, y: top + s(165) }, scale, colors.brandStrong, colors, font);
  drawRoad(paint, left, top + s(260), top + s(440), scale, colors.brandStrong);
  drawStop(paint, texts.to, { left, right, y: top + s(525) }, scale, colors.accent, colors, font);
  paint.fillStyle = colors.bgGrouped;
  paint.fillRect(left, top + s(650), right - left, s(4));
  fitted(paint, texts.when, 600, s(60), right - left, font);
  write(paint, texts.when, left, top + s(740), colors.textMuted, 'left');
  paint.font = `600 ${s(60)}px ${font}`;
  write(paint, texts.seats, left, top + s(830), colors.textMuted, 'left');
  // The price gets smaller until it fits beside the seats: nothing overlaps (docs/121).
  const room = right - left - paint.measureText(texts.seats).width - s(40);
  fitted(paint, texts.price, 800, s(76), room, font);
  write(paint, texts.price, right, top + s(830), colors.brandStrong, 'right');
  paint.fillStyle = colors.brandStrong;
  box(paint, left, top + s(910), right - left, s(130), s(36));
  paint.font = `800 ${s(64)}px ${font}`;
  write(paint, texts.button, at.x + s(450), top + s(998), colors.bg, 'center');
}
