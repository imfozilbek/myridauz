// 16.47 → 24.47 s: people going the same way ride in one car through the mountains and share the costs.
import { C } from '../../lib/palette.mjs';
import { text } from '../../lib/text.mjs';
import { COPY, g, enter, pop, span } from '../kit.mjs';
import { icon } from '../icons.mjs';
import { words } from '../type.mjs';
import { sky, mountains, road, SKY } from '../world.mjs';
import { car } from '../car.mjs';
import { prog, outCubic } from '../../lib/ease.mjs';

const K = COPY.concept;
const ROAD = 900, SPEED = 300;
const LINE_AT = [0, 4, 6]; // start of each line (local seconds)

// Road sign on a post; x moves with the road.
function sign(label, x, color) {
  return `<rect x="${x - 6}" y="${ROAD - 170}" width="12" height="170" fill="${C.slate}"/>` +
    `<rect x="${x - 150}" y="${ROAD - 260}" width="300" height="96" rx="18" fill="${color}"/>` +
    text(label, { x, y: ROAD - 196, anchor: 'middle', fill: C.white, size: 46, maxWidth: 260 });
}

export function concept(t, d) {
  const from = 700 - t * SPEED, to = 1300 - 480 * outCubic(prog(t, 4, 7.6));
  const people = Math.min(4, 1 + Math.floor(Math.max(0, t - 0.3) / 0.8));
  const coins = [0, 1, 2, 3].map((i) => g(icon('Coins', 300 + i * 160, 1090, 80, C.amberStrong, 2.2), { s: pop(t, 4.1 + i * 0.25, 0.4), cx: 300 + i * 160, cy: 1090 })).join('');
  const copy = K.lines.map((l, i) => g(words(l, t, LINE_AT[i] + 0.1, { cy: 1360, size: 92 }), { o: span(t, LINE_AT[i], LINE_AT[i + 1] ?? d + 1, 0.2) })).join('');
  return sky(SKY.day) +
    mountains(t, { y: 620, speed: 12, amp: 150, seed: 1, opacity: 0.1 }) +
    mountains(t, { y: 720, speed: 35, amp: 110, seed: 4, opacity: 0.16 }) +
    mountains(t, { y: 820, speed: 80, amp: 70, seed: 7, opacity: 0.26 }) +
    `<rect y="${ROAD + 80}" width="1080" height="1100" fill="${C.white}"/>` + road(t, { y: ROAD, speed: SPEED, color: C.road }) +
    (from > -200 ? sign(K.from, from, C.teal) : '') + sign(K.to, to, C.amberStrong) +
    car(400, ROAD + 40, t, { people, scale: 1.45 }) + g(coins, { o: enter(t, 4.0, 0.2) }) + copy;
}
