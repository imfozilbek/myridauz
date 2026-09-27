// 0 → 8.47 s: the pains of intercity travel today, one per beat, then "Endi boshqacha".
import { C } from '../../lib/palette.mjs';
import { text } from '../../lib/text.mjs';
import { COPY, bg, lines, rise, g, enter, pop, leave, CX } from '../kit.mjs';
import { icon } from '../icons.mjs';

const { question, pains, turn } = COPY.hook;
const GREY = '#F3F4F6';
const HITS = [2.44, 3.46, 4.46, 5.48, 7.0]; // pain cards start on these music hits
const ICONS = ['Hourglass', 'Banknote', 'UserRound', 'PhoneCall'];

function route(t) {
  const p = enter(t, 0.5, 0.9), a = pop(t, 0, 0.4), b = pop(t, 1.2, 0.4);
  return `<clipPath id="road"><rect x="300" y="600" width="${480 * p}" height="80"/></clipPath>` +
    `<line x1="300" y1="640" x2="780" y2="640" stroke="${C.teal}" stroke-width="10" stroke-dasharray="22 18" stroke-linecap="round" clip-path="url(#road)"/>` +
    g(`<circle cx="300" cy="640" r="30" fill="${C.teal}"/>`, { s: a, cx: 300, cy: 640 }) +
    g(`<circle cx="780" cy="640" r="30" fill="${C.amber}"/>`, { s: b, cx: 780, cy: 640 });
}

function pain(t, i) {
  const t0 = HITS[i], p = pop(t, t0, 0.3), o = Math.min(enter(t, t0, 0.15), leave(t, HITS[i + 1], 0.08));
  const shake = i === 3 ? Math.sin(t * 60) * 4 * leave(t, t0 + 0.6, 0.3) : 0;
  const mark = i === 1 || i === 2 ? `<circle cx="650" cy="650" r="46" fill="${C.amber}"/>` +
    text('?', { x: 650, y: 672, anchor: 'middle', fill: C.deep, size: 64 }) : '';
  const art = `<circle cx="${CX}" cy="760" r="170" fill="${GREY}"/>` + g(icon(ICONS[i], CX, 760, 170, C.muted, 1.6), { x: shake }) + mark;
  return g(g(art, { s: 0.85 + 0.15 * p, cx: CX, cy: 760 }) + lines(pains[i], { cy: 1110, size: 112 }), { o });
}

export function hook(t) {
  let body = bg(C.white);
  if (t < HITS[0]) body += g(route(t) + rise(lines(question, { cy: 900, size: 100 }), enter(t, 0.47, 0.35)), { o: leave(t, HITS[0], 0.1) });
  for (let i = 0; i < pains.length; i++) if (t >= HITS[i] && t < HITS[i + 1]) body += pain(t, i);
  if (t >= HITS[4]) body += rise(lines(turn, { cy: 900, size: 130, fill: C.teal }), enter(t, 7.1, 0.5));
  return body;
}
