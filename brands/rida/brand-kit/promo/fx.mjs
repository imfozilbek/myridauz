// Beat effects: flash, expanding rings, light sweep over a shape, turning rays.
import { C } from '../lib/palette.mjs';
import { prog, outCubic } from '../lib/ease.mjs';
import { W, H, CX } from './kit.mjs';

export function flash(t, at, { dur = 0.3, color = C.white, max = 0.55 } = {}) {
  const p = prog(t, at, at + dur);
  return p > 0 && p < 1 ? `<rect width="${W}" height="${H}" fill="${color}" opacity="${(max * (1 - p)).toFixed(3)}"/>` : '';
}

export function rings(t, at, cx = CX, cy = H / 2, { color = C.white, max = 700 } = {}) {
  let out = '';
  for (let i = 0; i < 2; i++) {
    const p = prog(t, at + i * 0.12, at + i * 0.12 + 0.9);
    if (p > 0 && p < 1) out += `<circle cx="${cx}" cy="${cy}" r="${(40 + max * outCubic(p)).toFixed(1)}" fill="none" stroke="${color}" stroke-width="${(10 * (1 - p)).toFixed(2)}" opacity="${(0.6 * (1 - p)).toFixed(3)}"/>`;
  }
  return out;
}

// A soft white band crossing the square (x, y, size) once, starting at `at`.
export function sweep(t, at, x, y, size, id = 'sweep') {
  const p = prog(t, at, at + 0.7);
  if (p <= 0 || p >= 1) return '';
  const bx = x - size + p * size * 3;
  return `<defs><clipPath id="${id}"><rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${size * 0.22}"/></clipPath></defs>` +
    `<g clip-path="url(#${id})"><rect x="${bx.toFixed(1)}" y="${y - size}" width="${size * 0.35}" height="${size * 3}" fill="${C.white}" opacity="0.45" transform="rotate(20 ${bx.toFixed(1)} ${y})"/></g>`;
}

// Soft rays turning slowly around (cx, cy).
export function rays(t, cx, cy, { color = C.white, opacity = 0.08, len = 1400 } = {}) {
  let d = '';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * 2 * Math.PI + t * 0.08, b = a + 0.12;
    d += `M${cx} ${cy}L${(cx + len * Math.cos(a)).toFixed(1)} ${(cy + len * Math.sin(a)).toFixed(1)}L${(cx + len * Math.cos(b)).toFixed(1)} ${(cy + len * Math.sin(b)).toFixed(1)}Z`;
  }
  return `<path d="${d}" fill="${color}" opacity="${opacity}"/>`;
}
