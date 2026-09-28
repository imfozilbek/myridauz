// 60.47 → 76.47 s: why it is safe. Checked drivers, ratings, loved ones always informed, "Mashinada ayol bor".
import { C } from '../../lib/palette.mjs';
import { text, markR } from '../../lib/text.mjs';
import { squircle } from '../../lib/brand.mjs';
import { COPY, pill, rise, g, enter, pop, span, CX } from '../kit.mjs';
import { words } from '../type.mjs';
import { stage } from '../world.mjs';
import { rings } from '../fx.mjs';
import { prog, outCubic } from '../../lib/ease.mjs';
import { icon, iconOf } from '../icons.mjs';
import { star } from '../ui.mjs';

const K = COPY.trust;
const card = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="44" fill="${C.white}" filter="url(#soft)"/>`;
const SHADOW = `<defs><filter id="soft" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="18" stdDeviation="24" flood-color="${C.shadow}" flood-opacity="0.12"/></filter></defs>`;
const head = (list, t, cy = 400) => words(list, t, 0.1, { cy, size: 88, stagger: 0.07 });
// Small sparks flying out of (cx, cy) right after `at`.
function sparks(t, at, cx, cy, color = C.amber) {
  const p = prog(t, at, at + 0.6);
  if (p <= 0 || p >= 1) return '';
  return Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * 2 * Math.PI, r = 20 + 90 * outCubic(p);
    return `<circle cx="${(cx + r * Math.cos(a)).toFixed(1)}" cy="${(cy + r * Math.sin(a)).toFixed(1)}" r="${(7 * (1 - p)).toFixed(2)}" fill="${color}"/>`;
  }).join('');
}

function checked(t) {
  const rows = K.items.map((label, i) => {
    const y = 960 + i * 86, p = pop(t, 0.6 + i * 0.55, 0.4);
    return g(`<circle cx="300" cy="${y}" r="26" fill="${C.teal}"/>` + icon('Check', 300, y, 32, C.white, 3), { s: p, cx: 300, cy: y }) +
      g(text(label, { x: 350, y: y + 16, fill: C.ink, weight: 600, size: 46 }), { o: enter(t, 0.6 + i * 0.55, 0.3) });
  }).join('');
  const face = enter(t, 0.7, 0.4), car = enter(t, 1.25, 0.4);
  return head(K.check, t) + card(190, 580, 700, 700) +
    `<circle cx="370" cy="760" r="110" fill="${face > 0.5 ? C.teal : C.line}"/>` + icon('User', 370, 760, 130, face > 0.5 ? C.white : C.muted, 1.8) +
    `<rect x="530" y="660" width="300" height="200" rx="32" fill="${car > 0.5 ? C.teal : C.line}"/>` + icon('CarFront', 680, 760, 130, car > 0.5 ? C.white : C.muted, 1.8) +
    rows + g(pill(K.stamp, { cy: 1370, size: 52, bg: C.teal, fg: C.white, iconSvg: iconOf('BadgeCheck', 2.4) }), { s: pop(t, 3.3, 0.5), cx: CX, cy: 1370 }) + rings(t, 3.3, CX, 1370, { color: C.teal, max: 360 });
}

function rating(t) {
  const stars = [0, 1, 2, 3, 4].map((i) => {
    const x = CX + (i - 2) * 150;
    return star(x, 720, 64, C.line) + g(star(x, 720, 64, C.amber), { s: pop(t, 0.5 + i * 0.25, 0.4), cx: x, cy: 720 }) + sparks(t, 0.55 + i * 0.25, x, 720);
  }).join('');
  const review = (label, y, t0) => g(card(170, y, 740, 130) + [0, 1, 2, 3, 4].map((i) => star(240 + i * 40, y + 45, 16)).join('') +
    text(label, { x: 220, y: y + 104, fill: C.ink, weight: 600, size: 44 }), { o: enter(t, t0, 0.35), y: 30 * (1 - enter(t, t0, 0.35)) });
  return head(K.rating, t, 380) + rise(text(K.ratingSub, { x: CX, y: 490, anchor: 'middle', fill: C.muted, weight: 600, size: 52 }), enter(t, 0.3, 0.4), 20) +
    stars + g(text('4,9', { x: CX, y: 960, anchor: 'middle', fill: C.ink, size: 170 }), { s: pop(t, 1.8, 0.5), cx: CX, cy: 900 }) +
    review(K.reviews[0], 1060, 2.4) + review(K.reviews[1], 1220, 2.9);
}

// The passenger shares the trip; the family sees the car and each step of the way (docs/43).
function share(t) {
  const R = COPY.results.trips[0];
  const steps = K.shareSteps.map((label, i) => {
    const y = 1000 + i * 100, done = t >= 1 + i;
    return (i ? `<line x1="250" y1="${y - 72}" x2="250" y2="${y - 28}" stroke="${done ? C.teal : C.line}" stroke-width="6"/>` : '') +
      g(`<circle cx="250" cy="${y}" r="26" fill="${done ? C.teal : C.line}"/>` + (done ? icon('Check', 250, y, 32, C.white, 3) : ''), { s: done ? pop(t, 1 + i, 0.4) : 1, cx: 250, cy: y }) +
      text(label, { x: 300, y: y + 16, fill: done ? C.ink : C.muted, weight: 600, size: 46 });
  }).join('');
  const body = card(150, 600, 780, 700) + squircle(200, 640, 96, C.teal) + markR({ cx: 248, cy: 688, h: 60, fill: C.white }) +
    text(K.shareTitle, { x: 330, y: 705, fill: C.ink, size: 50 }) + text(COPY.results.route, { x: 200, y: 800, fill: C.ink, weight: 600, size: 44 }) +
    text(K.shareCar, { x: 200, y: 860, fill: C.muted, weight: 600, size: 38 }) + star(214, 903, 14) +
    text(`${R.name} · ${R.rating}`, { x: 238, y: 917, fill: C.muted, weight: 600, size: 38 }) + steps;
  const press = 1 - 0.05 * pop(t, 0.55, 0.2) * (1 - enter(t, 0.75, 0.2));
  return head(K.share, t, 360) + g(pill(K.shareButton, { cy: 520, size: 42, bg: C.teal, fg: C.white, iconSvg: iconOf('Send', 2.4) }), { s: pop(t, 0.2, 0.4) * press, cx: CX, cy: 520 }) +
    g(body, { o: enter(t, 0.7, 0.4), y: 40 * (1 - enter(t, 0.7, 0.4)) });
}

function woman(t) {
  const on = enter(t, 1.0, 0.35), knob = 440 + 200 * on;
  return g(pill(K.woman, { cy: 620, size: 64, bg: C.amber, fg: C.deep }), { s: pop(t, 0.2, 0.5), cx: CX, cy: 620 }) +
    `<rect x="340" y="770" width="400" height="200" rx="100" fill="${on > 0.5 ? C.teal : C.greyLight}"/><circle cx="${knob}" cy="870" r="80" fill="${C.white}"/>` +
    rings(t, 1.0, 640, 870, { color: C.teal, max: 260 }) + words(K.womanLine, t, 1.6, { cy: 1150, size: 92 });
}

const PARTS = [checked, rating, share, woman];
export function trust(t) {
  const i = Math.min(3, Math.floor(t / 4)), local = t - i * 4, p = enter(local, 0, 0.5);
  return SHADOW + stage(t) + g(PARTS[i](local), { o: span(local, -1, 4.05, 0.2), y: 60 * (1 - p) });
}
