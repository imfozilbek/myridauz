// Promo video helpers: frame size, timing, groups, headlines, pills, wipes (docs/41).
import fs from 'node:fs';
import { text, layout } from '../lib/text.mjs';
import { C } from '../lib/palette.mjs';
import { prog, outCubic, outBack } from '../lib/ease.mjs';

export const COPY = JSON.parse(fs.readFileSync(new URL('./copy.json', import.meta.url), 'utf8'));
export const W = 1080, H = 1920, CX = W / 2;
export const SOFT = C.soft; // color.brand.soft (docs/20)

// Eased progress: entrance from t0, pop with overshoot, exit before `end`.
export const enter = (t, t0, dur = 0.4) => outCubic(prog(t, t0, t0 + dur));
export const pop = (t, t0, dur = 0.5) => outBack(prog(t, t0, t0 + dur));
export const leave = (t, end, dur = 0.25) => 1 - outCubic(prog(t, end - dur, end));
// Shown between a and b: fades in at a, out at b.
export const span = (t, a, b, fade = 0.3) => Math.min(enter(t, a, fade), leave(t, b, fade));

const n = (v) => +v.toFixed(3);
// Group with opacity, offset and scale around (cx, cy).
export function g(body, { o = 1, x = 0, y = 0, s = 1, cx = CX, cy = H / 2 } = {}) {
  if (o <= 0.001) return '';
  const scale = s === 1 ? '' : ` translate(${n(cx)} ${n(cy)}) scale(${n(s)}) translate(${n(-cx)} ${n(-cy)})`;
  return `<g opacity="${n(Math.min(1, o))}" transform="translate(${n(x)} ${n(y)})${scale}">${body}</g>`;
}
// Rises into place as p goes 0 → 1.
export const rise = (body, p, dy = 50) => g(body, { o: p, y: dy * (1 - p) });

// Rounded label: text with optional leading icon markup, centered at (cx, cy).
export function pill(label, { cx = CX, cy, size = 44, bg: fill = C.white, fg = C.teal, iconSvg, pad = 0.8, weight = 800 }) {
  const w = layout(label, { weight, size }).width, iw = iconSvg ? size * 1.3 : 0;
  const h = size * 2, total = w + iw + size * pad * 2, x = cx - total / 2;
  return `<rect x="${n(x)}" y="${n(cy - h / 2)}" width="${n(total)}" height="${h}" rx="${h / 2}" fill="${fill}"/>` +
    (iconSvg ? iconSvg(x + size * pad + size * 0.5, cy, size * 0.95, fg) : '') +
    text(label, { x: x + size * pad + iw, y: cy + size * 0.35, fill: fg, weight, size });
}

// Circle wipe that covers the frame by time `at` (the next scene starts in `fill`).
export function wipe(t, at, fill, { dur = 0.45, cx = CX, cy = H / 2 } = {}) {
  if (t < at - dur || t >= at) return '';
  const r = Math.hypot(W, H) * outCubic(prog(t, at - dur, at));
  return `<circle cx="${cx}" cy="${cy}" r="${n(r)}" fill="${fill}"/>`;
}
