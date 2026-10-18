// The line of a route of the brand (docs/38): teal start, dashes, amber finish. Both ways, one under the
// other (owner, 18.10.2026); the dots of the ends stand in two columns. At size 52 the card is 200 high.
import { text, layout } from './text.mjs';
import { C } from './palette.mjs';

export function routeCard({ x, y, width, from, to, size = 52 }) {
  const k = size / 52, widest = Math.max(layout(from, { size }).width, layout(to, { size }).width);
  const a = x + 56 * k, b = x + width - 48 * k - widest - 40 * k, step = 34 * k;
  const way = ([start, end], cy) => {
    const first = a + 40 * k + layout(start, { size }).width + 28 * k, n = Math.max(1, Math.floor((b - 28 * k - first) / step));
    const dashes = Array.from({ length: n }, (_, i) => `<rect x="${first + i * step}" y="${cy - 6 * k}" width="${22 * k}" height="${12 * k}" rx="${6 * k}" fill="${C.teal}"/>`).join('');
    return `<circle cx="${a}" cy="${cy}" r="${22 * k}" fill="${C.teal}"/>` + text(start, { x: a + 40 * k, y: cy + 18 * k, fill: C.ink, size }) + dashes +
      `<circle cx="${b}" cy="${cy}" r="${22 * k}" fill="${C.amber}"/>` + text(end, { x: b + 40 * k, y: cy + 18 * k, fill: C.ink, size });
  };
  return `<rect x="${x}" y="${y}" width="${width}" height="${200 * k}" rx="${40 * k}" fill="${C.white}" stroke="${C.divider}" stroke-width="6"/>` +
    way([from, to], y + 62 * k) + way([to, from], y + 142 * k);
}
