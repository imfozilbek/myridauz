// 40.47 → 60.47 s: the driver side. Intro on amber, publish, requests, confirm, shared costs.
import { C } from '../../lib/palette.mjs';
import { COPY, pill, g, enter, pop, leave, span, CX } from '../kit.mjs';
import { words, stepCaption } from '../type.mjs';
import { sky, mountains, road, stage, SKY } from '../world.mjs';
import { rays, flash } from '../fx.mjs';
import { car } from '../car.mjs';
import { phone, slide } from '../phone.mjs';
import { icon, iconOf } from '../icons.mjs';
import { publish, TAP } from '../screens/publish.mjs';
import { requests } from '../screens/requests.mjs';

const K = COPY.driver;
const PAIN_ICONS = ['Hourglass', 'MessagesSquare', 'Repeat'];

// Driver pains as chips flying in from the sides under the question, on amber with light.
function intro(t) {
  const chips = K.pains.map((label, i) => {
    const p = enter(t, 0.9 + i * 0.45, 0.4), side = i % 2 ? 1 : -1;
    return g(pill(label, { cy: 1090 + i * 130, size: 46, bg: C.white, fg: C.ink, iconSvg: iconOf(PAIN_ICONS[i], 2.2) }), { o: p, x: side * 500 * (1 - p) });
  }).join('');
  return sky(SKY.amber) + rays(t, CX, 560, { opacity: 0.12 }) + mountains(t, { y: 1560, speed: 10, amp: 120, seed: 3, color: C.deep, opacity: 0.12 }) +
    g(`<circle cx="${CX}" cy="560" r="180" fill="${C.white}" opacity="0.35"/>` + icon('CarFront', CX, 560, 220, C.deep, 1.8), { s: pop(t, 0.1, 0.6), cx: CX, cy: 560 }) +
    words(K.intro, t, 0.35, { cy: 880, size: 128, fill: C.deep }) + chips;
}

// Phone part: t from 0 (44.47 s) to 12. Publish 0…4, requests 4…12 (arrivals, then confirmations).
const FOCUS = [[1.6, 2.4, 1.2, 1319], [0, 3.6, 1, 960], [2.7, 3.6, 1.35, 816]];
function app(t) {
  const onPublish = t < 4, p = (t - 3.65) / 0.35;
  const screen = onPublish && p > 0 ? slide(publish(t), requests(t - 4), p) : onPublish ? publish(t) : requests(t - 4);
  const i = t < 4 ? 0 : t < 8 ? 1 : 2, local = t - [0, 4, 8][i];
  const [a, b, z, fy] = FOCUS[i], push = enter(local, a, 0.4) * leave(local, b + 0.4, 0.4), zoom = 1 + (z - 1) * push;
  const lift = onPublish ? enter(t, TAP - 0.5, 0.4) * leave(t, 3.85, 0.5) : 0;
  const cam = 420 * (1 - enter(t, 0, 0.6)) - 360 * lift + Math.sin(t * 1.4) * 8;
  const tilt = 6 * (1 - enter(t, 0, 0.9)) + Math.sin(t * 0.9) * 0.6;
  return stage(t, C.amberStrong) + flash(t, 0, { max: 0.5 }) + phone(screen, { cam, zoom, fy, tilt }) +
    g(stepCaption(i + 1, K.steps[i], local), { o: Math.min(1 - lift, 1 - (zoom - 1) * 20) });
}

// Solutions on the road: the full car leaves without waiting, then turns back with people too.
function outro(t) {
  const back = t >= 2, x = back ? 760 - 380 * enter(t, 2.1, 1.6) : 300 + 460 * enter(t, 0, 1.8);
  const art = (name) => `<circle cx="${CX}" cy="470" r="130" fill="${C.amber}" opacity="0.2"/>` + icon(name, CX, 470, 150, C.amberStrong, 1.8);
  const strike = `<line x1="440" y1="570" x2="640" y2="370" stroke="${C.teal}" stroke-width="16" stroke-linecap="round" stroke-dasharray="290" stroke-dashoffset="${(290 * (1 - enter(t, 0.4, 0.4))).toFixed(1)}"/>`;
  return sky(SKY.day) + mountains(t, { y: 700, speed: 20, amp: 120, seed: 6, opacity: 0.12 }) + mountains(t, { y: 800, speed: 50, amp: 70, seed: 8, opacity: 0.22 }) +
    `<rect y="940" width="1080" height="980" fill="${C.white}"/>` + road(t, { y: 860, speed: back ? -380 : 380, color: C.road }) +
    g(art('Hourglass') + strike, { o: span(t, -1, 2, 0.25) }) + g(art('Repeat'), { o: span(t, 2, 99, 0.25) }) +
    car(x, 900, t, { flip: back, scale: 1.1 }) +
    K.outro.map((l, i) => g(words(l, t, i * 2 + 0.1, { cy: 1260, size: 88 }), { o: span(t, i * 2, i ? 99 : 2, 0.2) })).join('');
}

export function driver(t) {
  if (t < 4) return intro(t);
  if (t < 16) return app(t - 4);
  return outro(t - 16);
}
