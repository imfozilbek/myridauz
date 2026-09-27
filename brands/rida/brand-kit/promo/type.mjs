// Kinetic type: words rise one after another; *word* is drawn in the accent color.
import { C } from '../lib/palette.mjs';
import { text, layout } from '../lib/text.mjs';
import { prog, outBack } from '../lib/ease.mjs';
import { CX } from './kit.mjs';

const clean = (w) => w.replace(/\*/g, '');

// lines: array of strings; t: scene time; t0: when the first word starts.
export function words(lines, t, t0, { cy, size = 96, fill = C.ink, accent = C.amberStrong, lh = 1.18, stagger = 0.08, dur = 0.5, weight = 800, maxWidth = 960, x = CX } = {}) {
  const widest = Math.max(...lines.map((l) => layout(clean(l), { weight, size }).width));
  const s = widest > maxWidth ? (size * maxWidth) / widest : size;
  const space = layout(' ', { weight, size: s }).width, step = s * lh, top = cy - ((lines.length - 1) * step) / 2;
  let k = 0, out = '';
  lines.forEach((line, li) => {
    const tokens = line.split(' '), widths = tokens.map((w) => layout(clean(w), { weight, size: s }).width);
    let wx = x - (widths.reduce((a, b) => a + b, 0) + space * (tokens.length - 1)) / 2;
    tokens.forEach((w, i) => {
      const p = outBack(prog(t, t0 + k++ * stagger, t0 + k * stagger + dur));
      if (p > 0) {
        const body = text(clean(w), { x: +wx.toFixed(1), y: +(top + li * step + s * 0.35).toFixed(1), fill: w.startsWith('*') ? accent : fill, weight, size: +s.toFixed(2) });
        out += `<g opacity="${Math.min(1, p * 1.5).toFixed(3)}" transform="translate(0 ${((1 - p) * s * 0.6).toFixed(1)})">${body}</g>`;
      }
      wx += widths[i] + space;
    });
  });
  return out;
}

// Numbered step caption above the phone: the number pops, the words follow.
export function stepCaption(num, label, t, { cy = 290, size = 58 } = {}) {
  const w = layout(label, { size }).width, r = size * 0.62, x = CX - (r * 2 + 24 + w) / 2, p = outBack(prog(t, 0, 0.4));
  return `<g transform="translate(${x + r} ${cy}) scale(${p.toFixed(3)}) translate(${-x - r} ${-cy})"><circle cx="${x + r}" cy="${cy}" r="${r}" fill="${C.teal}"/>` +
    text(String(num), { x: x + r, y: cy + size * 0.28, anchor: 'middle', fill: C.white, size: size * 0.8 }) + '</g>' +
    words([label], t, 0.1, { cy, size, x: x + r * 2 + 24 + w / 2, stagger: 0.05 });
}
