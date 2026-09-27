// 16.47 → 24.47 s: people going the same way ride in one car and share the costs. No roles, just people.
import { C } from '../../lib/palette.mjs';
import { text } from '../../lib/text.mjs';
import { COPY, bg, lines, rise, g, enter, pop, span, CX } from '../kit.mjs';
import { icon } from '../icons.mjs';
import { prog } from '../../lib/ease.mjs';

const K = COPY.concept;
const Y = 640, X0 = 170, X1 = 910; // road
const SEAT = 170, GAP = 36, SY = 900, SX = CX - (4 * SEAT + 3 * GAP) / 2;
const LINE_AT = [0, 4, 6]; // start of each line (local seconds)
const FILL_AT = [0.3, 1.2, 1.9, 2.6];
const COLORS = [C.teal, C.amber, C.deep, C.amberStrong];

function road(t) {
  const p = prog(t, 0.2, 7.8), x = X0 + (X1 - 110 - X0) * (0.5 - Math.cos(Math.PI * p) / 2);
  return `<line x1="${X0}" y1="${Y}" x2="${X1}" y2="${Y}" stroke="${C.teal}" stroke-opacity="0.3" stroke-width="10" stroke-dasharray="22 18" stroke-linecap="round"/>` +
    `<circle cx="${X0}" cy="${Y}" r="26" fill="${C.teal}"/><circle cx="${X1}" cy="${Y}" r="26" fill="${C.amber}"/>` +
    text(K.from, { x: X0, y: Y + 90, anchor: 'middle', fill: C.ink, size: 44 }) +
    text(K.to, { x: X1, y: Y + 90, anchor: 'middle', fill: C.ink, size: 44 }) +
    `<circle cx="${x}" cy="${Y - 58}" r="64" fill="${C.white}"/>` + icon('Car', x, Y - 62, 120, C.teal, 2);
}

// Four people in one car: every seat is a person, nobody is a role.
function seat(t, i) {
  const x = SX + i * (SEAT + GAP), cx = x + SEAT / 2, cy = SY + SEAT / 2;
  const f = pop(t, FILL_AT[i], 0.45), hop = 1 + 0.08 * pop(t, 6.05 + i * 0.12, 0.35) * (1 - enter(t, 6.5 + i * 0.12, 0.3));
  let out = `<rect x="${x}" y="${SY}" width="${SEAT}" height="${SEAT}" rx="40" fill="none" stroke="#CBD5E1" stroke-width="6" stroke-dasharray="18 14"/>`;
  if (f > 0) out += g(`<rect x="${x}" y="${SY}" width="${SEAT}" height="${SEAT}" rx="40" fill="${COLORS[i]}"/>` + icon('User', cx, cy, 96, C.white, 2.2), { s: f * hop, cx, cy });
  return out + g(icon('Coins', cx, SY - 70, 70, C.amberStrong, 2.2), { s: pop(t, 4.1 + i * 0.25, 0.4), cx, cy: SY - 70 });
}

export function concept(t, d) {
  const seats = [0, 1, 2, 3].map((i) => seat(t, i)).join('');
  const copy = K.lines.map((l, i) => rise(lines(l, { cy: 1300, size: 84 }), span(t, LINE_AT[i] + 0.1, LINE_AT[i + 1] ?? d + 1, 0.25), 30)).join('');
  return bg(C.white) + road(t) + seats + copy;
}
