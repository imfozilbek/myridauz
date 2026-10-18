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
export function drawStop(
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
export function drawRoad(paint: Paint, left: number, from: number, to: number, scale: number, color: string) {
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

// The white card of a story at its top left corner: both ends, the time, the seats and the price,
// «Joy band qilish» (docs/88 L19). At scale 1 it is 900 × 1000.
export const TRIP_CARD = { width: 900, height: 1000 } as const;
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
  box(paint, at.x, top, s(TRIP_CARD.width), s(TRIP_CARD.height), s(50));
  drawStop(paint, texts.from, { left, right, y: top + s(165) }, scale, colors.brandStrong, colors, font);
  drawRoad(paint, left, top + s(250), top + s(330), scale, colors.brandStrong);
  drawStop(paint, texts.to, { left, right, y: top + s(405) }, scale, colors.accent, colors, font);
  paint.fillStyle = colors.bgGrouped;
  paint.fillRect(left, top + s(530), right - left, s(4));
  drawFacts(paint, texts, { left, right, when: top + s(620), seats: top + s(710) }, scale, colors, font);
  paint.fillStyle = colors.brandStrong;
  box(paint, left, top + s(790), right - left, s(130), s(36));
  paint.font = `800 ${s(64)}px ${font}`;
  write(paint, texts.button, at.x + s(450), top + s(878), colors.bg, 'center');
}

// The time, then the seats and the price on one line: the price gets smaller until it fits beside
// the seats, nothing overlaps (docs/121).
export function drawFacts(
  paint: Paint,
  texts: TripPictureTexts,
  at: Box & { readonly when: number; readonly seats: number },
  scale: number,
  colors: BrandColors,
  font: string,
) {
  fitted(paint, texts.when, 600, 60 * scale, at.right - at.left, font);
  write(paint, texts.when, at.left, at.when, colors.textMuted, 'left');
  paint.font = `600 ${60 * scale}px ${font}`;
  write(paint, texts.seats, at.left, at.seats, colors.textMuted, 'left');
  const room = at.right - at.left - paint.measureText(texts.seats).width - 40 * scale;
  fitted(paint, texts.price, 800, 76 * scale, room, font);
  write(paint, texts.price, at.right, at.seats, colors.brandStrong, 'right');
}
