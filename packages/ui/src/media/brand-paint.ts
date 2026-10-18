import { box, write, type Paint } from './story-paint';

// The brand on a picture (docs/36, G88 docs/193): its logo tile and the lines of value of the flyer.
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

type Check = {
  readonly x: number;
  readonly y: number;
  // The height of the words.
  readonly size: number;
  readonly color: string;
  readonly mark: string;
};
// A column: the step to the next line and where the column stands.
type Checks = Check & { readonly line: number; readonly align: 'left' | 'center' };

const parts = (size: number) => ({ radius: size * 0.55, gap: size * 0.4 });
const checkWidth = (paint: Paint, item: string, size: number) =>
  2 * parts(size).radius + parts(size).gap + paint.measureText(item).width;

// One line of value of the flyer: a round check and its words, from its left edge on its baseline.
function drawCheck(paint: Paint, item: string, left: number, baseline: number, at: Check) {
  const { radius, gap } = parts(at.size);
  const middle = baseline - at.size * 0.35;
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
  write(paint, item, left + 2 * radius + gap, baseline, at.color, 'left');
}

// The lines of value under a picture (G88), one per line; centred lines keep their checks in one column.
export function drawChecks(paint: Paint, items: readonly string[], at: Checks, font: string) {
  paint.font = `600 ${at.size}px ${font}`;
  const widest = Math.max(...items.map((item) => checkWidth(paint, item, at.size)));
  const left = at.align === 'center' ? at.x - widest / 2 : at.x;
  items.forEach((item, index) => drawCheck(paint, item, left, at.y + index * at.line, at));
}

// The lines of value side by side, centred on x: the chat card of a trip.
export function drawCheckRow(paint: Paint, items: readonly string[], at: Check, font: string) {
  paint.font = `600 ${at.size}px ${font}`;
  const space = at.size * 1.2;
  const widths = items.map((item) => checkWidth(paint, item, at.size));
  let left = at.x - (widths.reduce((sum, width) => sum + width, 0) + space * (items.length - 1)) / 2;
  items.forEach((item, index) => {
    drawCheck(paint, item, left, at.y, at);
    left += (widths[index] ?? 0) + space;
  });
}
