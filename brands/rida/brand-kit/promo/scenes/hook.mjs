// 0 → 8.47 s: a grey, tired world of intercity travel. One pain per beat, then color comes back.
import { C } from '../../lib/palette.mjs';
import { text } from '../../lib/text.mjs';
import { COPY, g, enter, pop, leave, CX } from '../kit.mjs';
import { icon } from '../icons.mjs';
import { words } from '../type.mjs';
import { sky, mountains, perspectiveRoad, mix, SKY } from '../world.mjs';

const { question, pains, turn } = COPY.hook;
const HITS = [2.44, 3.46, 4.46, 5.48, 7.0]; // pain cards start on these music hits
const ICONS = ['Hourglass', 'TrendingUp', 'UserRound', 'UsersRound'];

// Grey world that fills with brand color as p goes 0 → 1.
function world(t, p) {
  const col = mix('#94A3B8', C.teal, p);
  return sky([mix(SKY.grey[0], SKY.day[0], p), mix(SKY.grey[1], SKY.day[1], p)]) +
    mountains(t, { y: 1180, speed: 6, amp: 120, seed: 2, color: col, opacity: 0.18 }) +
    mountains(t, { y: 1260, speed: 14, amp: 80, seed: 5, color: col, opacity: 0.28 }) +
    perspectiveRoad(t, { horizon: 1300, color: mix('#CBD5E1', '#99E6DA', p), speed: 0.15 + 1.2 * p });
}

// Each icon acts out its pain: the hourglass turns, the price climbs, question marks bounce.
function art(t, i, t0) {
  const l = t - t0, y = 640;
  let body = icon(ICONS[i], CX, y, 170, C.muted, 1.6);
  if (i === 0) body = `<g transform="rotate(${(180 * enter(l, 0.2, 0.5)).toFixed(1)} ${CX} ${y})">${body}</g>`;
  if (i === 1) body = g(body, { x: 30 * enter(l, 0, 0.6), y: -30 * enter(l, 0, 0.6) });
  const mark = i >= 2 ? g(`<circle cx="650" cy="530" r="46" fill="${C.amber}"/>` + text('?', { x: 650, y: 552, anchor: 'middle', fill: C.deep, size: 64 }),
    { y: -18 * Math.abs(Math.sin(l * 9)) * leave(l, 0.9, 0.3), s: pop(l, 0.05, 0.4), cx: 650, cy: 530 }) : '';
  return `<circle cx="${CX}" cy="${y}" r="170" fill="${C.white}" opacity="0.9"/>` + body + mark;
}

function pain(t, i) {
  const t0 = HITS[i], shake = Math.sin((t - t0) * 70) * 16 * leave(t, t0 + 0.18, 0.18);
  const o = Math.min(enter(t, t0, 0.1), leave(t, HITS[i + 1], 0.08));
  return g(g(art(t, i, t0), { s: 0.85 + 0.15 * pop(t, t0, 0.3), cx: CX, cy: 640 }) +
    words(pains[i], t, t0, { cy: 1000, size: 112, stagger: 0.06, dur: 0.35 }), { o, x: shake });
}

export function hook(t) {
  const color = enter(t, 7.0, 1.3);
  let body = world(t, color);
  if (t < HITS[0]) body += g(words(question, t, 0.47, { cy: 760, size: 104 }), { o: leave(t, HITS[0], 0.1) });
  for (let i = 0; i < pains.length; i++) if (t >= HITS[i] && t < HITS[i + 1]) body += pain(t, i);
  if (t >= HITS[4]) body += words(turn, t, 7.1, { cy: 760, size: 140, fill: C.teal, stagger: 0.18 });
  return body;
}
