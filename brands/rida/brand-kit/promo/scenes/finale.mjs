// 92.75 → 112.56 s: the quiet moment, both promises on turquoise, the logo, and the end card.
import { C } from '../../lib/palette.mjs';
import { text } from '../../lib/text.mjs';
import { COPY, bg, lines, pill, rise, g, enter, pop, leave, CX } from '../kit.mjs';
import { icon, iconOf } from '../icons.mjs';
import { logo } from './reveal.mjs';

const K = COPY.finale;
const LOGO_Y = 560;

// 92.75 → 95.4 s: the music drops; a road leads home.
export function pause(t) {
  const road = enter(t, 0.1, 1.2);
  return bg(C.white) + `<line x1="160" y1="700" x2="${160 + 640 * road}" y2="700" stroke="${C.teal}" stroke-width="10" stroke-dasharray="22 18" stroke-linecap="round"/>` +
    `<circle cx="160" cy="700" r="24" fill="${C.teal}"/>` + g(icon('House', 900, 690, 130, C.amberStrong, 2), { s: pop(t, 1.1, 0.5), cx: 900, cy: 690 }) +
    g(lines(K.pause, { cy: 980, size: 104 }), { o: enter(t, 0.35, 0.8) });
}

// 95.4 → 105 s: "Safar toping" and "Yoʻlovchi toping" on the hits, then the logo.
export function finale(t) {
  const out = leave(t, 3.1, 0.3);
  const promise = (label, name, cy, t0) => g(`<circle cx="${CX}" cy="${cy - 150}" r="80" fill="${C.white}" opacity="0.2"/>` +
    icon(name, CX, cy - 150, 96, C.white, 2) + lines([label], { cy, size: 104, fill: C.white }), { o: Math.min(enter(t, t0, 0.25), out), s: 0.9 + 0.1 * pop(t, t0, 0.4), cx: CX, cy });
  return bg(C.teal) + promise(K.find, 'UserRound', 700, 0.41) + promise(K.findDriver, 'CarFront', 1180, 1.08) +
    (t >= 3.1 ? g(logo(t - 3.1, { cy: LOGO_Y }), { s: 1 + 0.02 * Math.max(0, 1 - ((t - 7.07) % 1) * 4) * (t > 7.07 ? 1 : 0), cx: CX, cy: LOGO_Y }) : '') +
    rise(text(K.tagline, { x: CX, y: 1250, anchor: 'middle', fill: C.white, weight: 800, size: 60 }), enter(t, 6.07, 0.5), 20);
}

// 105 → 112.56 s: the end card holds while the music fades out.
export function end(t) {
  return bg(C.teal) + logo(99, { cy: LOGO_Y }) + text(K.tagline, { x: CX, y: 1250, anchor: 'middle', fill: C.white, weight: 800, size: 60 }) +
    g(pill(K.soon, { cy: 1400, size: 50, iconSvg: iconOf('Send', 2.4) }), { s: pop(t, 0.3, 0.5), cx: CX, cy: 1400 }) +
    rise(text(K.site, { x: CX, y: 1545, anchor: 'middle', fill: C.mint, weight: 600, size: 56 }), enter(t, 0.8, 0.5), 20);
}
