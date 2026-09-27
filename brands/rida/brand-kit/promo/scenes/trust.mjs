// 60.47 → 76.47 s: why it is safe. Checked drivers, ratings, hidden numbers, "Mashinada ayol bor".
import { C } from '../../lib/palette.mjs';
import { text } from '../../lib/text.mjs';
import { COPY, bg, lines, pill, rise, g, enter, pop, span, SOFT, CX } from '../kit.mjs';
import { icon, iconOf } from '../icons.mjs';
import { star } from '../ui.mjs';

const K = COPY.trust;
const card = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="44" fill="${C.white}" filter="url(#soft)"/>`;
const SHADOW = '<defs><filter id="soft" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="18" stdDeviation="24" flood-color="#0F172A" flood-opacity="0.12"/></filter></defs>';
const head = (list, t, cy = 400) => rise(lines(list, { cy, size: 84 }), enter(t, 0.1, 0.4), 30);

function checked(t) {
  const rows = K.items.map((label, i) => {
    const y = 960 + i * 86, p = pop(t, 0.6 + i * 0.55, 0.4);
    return g(`<circle cx="300" cy="${y}" r="26" fill="${C.teal}"/>` + icon('Check', 300, y, 32, C.white, 3), { s: p, cx: 300, cy: y }) +
      g(text(label, { x: 350, y: y + 16, fill: C.ink, weight: 600, size: 46 }), { o: enter(t, 0.6 + i * 0.55, 0.3) });
  }).join('');
  const face = enter(t, 0.7, 0.4), car = enter(t, 1.25, 0.4);
  return head(K.check, t) + card(190, 580, 700, 700) +
    `<circle cx="370" cy="760" r="110" fill="${face > 0.5 ? C.teal : '#E5E7EB'}"/>` + icon('User', 370, 760, 130, face > 0.5 ? C.white : C.muted, 1.8) +
    `<rect x="530" y="660" width="300" height="200" rx="32" fill="${car > 0.5 ? C.teal : '#E5E7EB'}"/>` + icon('CarFront', 680, 760, 130, car > 0.5 ? C.white : C.muted, 1.8) +
    rows + g(pill(K.stamp, { cy: 1370, size: 52, bg: C.teal, fg: C.white, iconSvg: iconOf('BadgeCheck', 2.4) }), { s: pop(t, 3.3, 0.5), cx: CX, cy: 1370 });
}

function rating(t) {
  const stars = [0, 1, 2, 3, 4].map((i) => {
    const x = CX + (i - 2) * 150;
    return star(x, 720, 64, '#E5E7EB') + g(star(x, 720, 64, C.amber), { s: pop(t, 0.5 + i * 0.25, 0.4), cx: x, cy: 720 });
  }).join('');
  const review = (label, y, t0) => g(card(170, y, 740, 130) + [0, 1, 2, 3, 4].map((i) => star(240 + i * 40, y + 45, 16)).join('') +
    text(label, { x: 220, y: y + 104, fill: C.ink, weight: 600, size: 44 }), { o: enter(t, t0, 0.35), y: 30 * (1 - enter(t, t0, 0.35)) });
  return head(K.rating, t, 380) + rise(text(K.ratingSub, { x: CX, y: 490, anchor: 'middle', fill: C.muted, weight: 600, size: 52 }), enter(t, 0.3, 0.4), 20) +
    stars + g(text('4,9', { x: CX, y: 960, anchor: 'middle', fill: C.ink, size: 170 }), { s: pop(t, 1.8, 0.5), cx: CX, cy: 900 }) +
    review(K.reviews[0], 1060, 2.4) + review(K.reviews[1], 1220, 2.9);
}

function hidden(t) {
  const digits = '+998 90 123 45 67', masked = Math.floor(7 * enter(t, 1.2, 1.2));
  let shown = '', left = masked;
  for (const ch of digits.split('').reverse()) shown = (/\d/.test(ch) && left-- > 0 ? '•' : ch) + shown;
  return head(K.hidden, t, 420) + card(140, 700, 800, 200) + icon('Smartphone', 250, 800, 80, C.teal, 2) +
    text(shown, { x: 320, y: 825, fill: C.ink, size: 72 }) +
    g(`<circle cx="${CX}" cy="1060" r="80" fill="${C.teal}"/>` + icon('Lock', CX, 1060, 84, C.white, 2.2), { s: pop(t, 2.5, 0.5), cx: CX, cy: 1060 }) +
    rise(text(K.hiddenSub, { x: CX, y: 1250, anchor: 'middle', fill: C.muted, weight: 600, size: 48 }), enter(t, 2.8, 0.4), 20);
}

function woman(t) {
  const on = enter(t, 1.0, 0.35), knob = 440 + 200 * on;
  return g(pill(K.woman, { cy: 620, size: 64, bg: C.amber, fg: C.deep }), { s: pop(t, 0.2, 0.5), cx: CX, cy: 620 }) +
    `<rect x="340" y="770" width="400" height="200" rx="100" fill="${on > 0.5 ? C.teal : '#D1D5DB'}"/><circle cx="${knob}" cy="870" r="80" fill="${C.white}"/>` +
    rise(lines(K.womanLine, { cy: 1150, size: 88 }), enter(t, 1.6, 0.45), 30);
}

const PARTS = [checked, rating, hidden, woman];
export function trust(t) {
  const i = Math.min(3, Math.floor(t / 4)), local = t - i * 4;
  return SHADOW + bg(i % 2 ? SOFT : C.white) + g(PARTS[i](local), { o: span(local, -1, 4.05, 0.2) });
}
