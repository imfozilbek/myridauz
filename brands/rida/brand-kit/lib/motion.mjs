// Brand motion: logo reveal, region plate flip. Frames are pure functions of time t (seconds).
import { text, markR, textCentered, layout } from './text.mjs';
import { C, svg } from './palette.mjs';
import { squircle, plate, plateGeom } from './brand.mjs';
import { clamp, prog, outCubic, outBack, scaleAt } from './ease.mjs';

export function logoReveal(t, { wide = true } = {}) {
  const W = wide ? 1920 : 1080, H = 1080;
  const tileP = outBack(prog(t, 0, 0.6)), rP = outCubic(prog(t, 0.25, 0.75)), wP = outCubic(prog(t, 0.7, 1.25));
  const barP = outCubic(prog(t, 1.2, 1.6)), sP = outCubic(prog(t, 1.35, 1.8));
  let S, tx, ty, wordX, wordY, anchor, barX, barY, slX, slY, wordSize;
  if (wide) {
    S = 360; wordSize = 300;
    const ww = layout('Rida', { size: wordSize }).width, total = S + 70 + ww;
    tx = (W - total) / 2; ty = (H - S) / 2; wordX = tx + S + 70; wordY = 605; anchor = 'start';
    barX = wordX + 6; barY = 657; slX = barX + 160; slY = 690;
  } else {
    S = 300; wordSize = 230; tx = (W - S) / 2; ty = 230; wordX = W / 2; wordY = 790; anchor = 'middle';
    barX = W / 2 - 65; barY = 830; slX = W / 2; slY = 930;
  }
  const cx = tx + S / 2, cy = ty + S / 2;
  const body = `<rect width="${W}" height="${H}" fill="${C.white}"/>` +
    `<g id="tile" opacity="${clamp(tileP * 2)}" transform="${scaleAt(cx, cy, 0.5 + 0.5 * tileP)}">${squircle(tx, ty, S, C.teal)}` +
    `<g id="r" opacity="${rP}" transform="translate(0 ${S * 0.12 * (1 - rP)})">${markR({ cx, cy, h: S * 0.62, fill: C.white })}</g></g>` +
    `<g id="wordmark" opacity="${wP}" transform="translate(${wide ? -50 * (1 - wP) : 0} ${wide ? 0 : 40 * (1 - wP)})">${text('Rida', { x: wordX, y: wordY, anchor, fill: C.teal, size: wordSize })}</g>` +
    `<rect id="bar" x="${barX}" y="${barY}" width="${130 * barP}" height="12" rx="6" fill="${C.amber}"/>` +
    `<g id="slogan" opacity="${sP}" transform="translate(0 ${20 * (1 - sP)})">${text('Manzil sari', { x: slX, y: slY, anchor: wide ? 'start' : 'middle', fill: C.ink, weight: 600, size: wide ? 58 : 60 })}</g>`;
  return svg(W, H, body);
}

// Region codes roll like a number plate: roll 0.3 s, hold 0.45 s per region.
export function plateFlip(t, regions) {
  const step = 0.75, roll = 0.3, n = regions.length;
  const i = Math.floor(t / step) % n, local = t % step, p = outCubic(clamp(local / roll));
  const cur = regions[i], prev = regions[(i - 1 + n) % n];
  const box = { x: 110, y: 300, w: 860 }, g = plateGeom(box);
  const code = (r, dy, op) => `<g opacity="${op}" transform="translate(0 ${dy})">${textCentered(r.code, { cx: g.codeCx, cy: g.cy, h: g.codeH, fill: C.ink, maxWidth: g.codeMaxW })}</g>`;
  const name = (r, op) => `<g opacity="${op}">${textCentered(r.title.toUpperCase(), { cx: 540, cy: 780, h: 56, fill: C.white, maxWidth: 900, spacing: 0.04 })}</g>`;
  const rolling = t >= step && p < 1;
  const codes = rolling ? code(prev, -g.h * 0.8 * p, 1 - p) + code(cur, g.h * 0.8 * (1 - p), p) : code(cur, 0, 1);
  // Names change one after another (never overlap): old fades out, then new fades in.
  const q = clamp(local / roll);
  const names = rolling ? name(prev, clamp(1 - q * 2)) + name(cur, clamp(q * 2 - 1)) : name(cur, 1);
  return svg(1080, 1080, `<defs><clipPath id="codeclip"><rect x="${g.clip.x}" y="${g.clip.y}" width="${g.clip.w}" height="${g.clip.h}"/></clipPath></defs>` +
    `<rect width="1080" height="1080" fill="${C.teal}"/>` + plate('', box) +
    `<g id="code" clip-path="url(#codeclip)">${codes}</g>` + `<g id="region">${names}</g>` +
    textCentered('Manzil sari', { cx: 540, cy: 930, h: 40, fill: C.mint, weight: 600 }));
}
