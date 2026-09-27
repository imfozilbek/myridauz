// 8.47 → 16.47 s: the logo on turquoise, then what Rida is and where it lives.
import { C } from '../../lib/palette.mjs';
import { text, markR } from '../../lib/text.mjs';
import { squircle } from '../../lib/brand.mjs';
import { COPY, bg, lines, pill, rise, g, enter, pop, CX } from '../kit.mjs';
import { iconOf } from '../icons.mjs';

const { tagline, telegram } = COPY.reveal;

// Logo block: white tile with turquoise R, wordmark, amber bar, slogan. t = local time.
export function logo(t, { cy = 760, S = 300 } = {}) {
  const tile = pop(t, 0, 0.6), r = enter(t, 0.25, 0.5), w = enter(t, 0.7, 0.55), bar = enter(t, 1.2, 0.4), sl = enter(t, 1.35, 0.45);
  const y = cy - S / 2;
  return g(squircle(CX - S / 2, y, S, C.white) +
      g(markR({ cx: CX, cy, h: S * 0.62, fill: C.teal }), { o: r, y: S * 0.12 * (1 - r) }), { o: Math.min(1, tile * 2), s: 0.5 + 0.5 * tile, cx: CX, cy }) +
    rise(text('Rida', { x: CX, y: cy + S / 2 + 250, anchor: 'middle', fill: C.white, size: 230 }), w, 40) +
    `<rect x="${CX - 65}" y="${cy + S / 2 + 292}" width="${130 * bar}" height="14" rx="7" fill="${C.amber}"/>` +
    rise(text(COPY.finale.slogan, { x: CX, y: cy + S / 2 + 400, anchor: 'middle', fill: C.mint, weight: 600, size: 64 }), sl, 20);
}

export function reveal(t) {
  const up = enter(t, 3.0, 0.7);
  return bg(C.teal) + g(logo(t), { y: -190 * up }) +
    rise(lines(tagline, { cy: 1390, size: 84, fill: C.white }), enter(t, 3.3, 0.5)) +
    g(pill(telegram, { cy: 1600, size: 46, iconSvg: iconOf('Send', 2.4) }), { s: pop(t, 5.0, 0.5), cx: CX, cy: 1600 });
}
