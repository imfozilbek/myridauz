// 40.47 → 60.47 s: the driver side. Intro on amber, publish, requests, confirm, shared costs.
import { C } from '../../lib/palette.mjs';
import { COPY, bg, lines, pill, step, rise, g, enter, pop, leave, span, SOFT, CX } from '../kit.mjs';
import { phone, slide } from '../phone.mjs';
import { icon, iconOf } from '../icons.mjs';
import { publish, TAP } from '../screens/publish.mjs';
import { requests } from '../screens/requests.mjs';

const K = COPY.driver;
const PAIN_ICONS = ['Hourglass', 'MessagesSquare', 'Repeat'];
const PEOPLE = [C.teal, C.amber, C.deep, C.amberStrong];

// Driver pains as quiet chips under the question.
function intro(t) {
  const chips = K.pains.map((label, i) => {
    const p = enter(t, 0.9 + i * 0.45, 0.3);
    return g(pill(label, { cy: 1090 + i * 130, size: 46, bg: C.white, fg: C.ink, iconSvg: iconOf(PAIN_ICONS[i], 2.2) }), { o: p, y: 20 * (1 - p) });
  }).join('');
  return bg(C.amber) + g(`<circle cx="${CX}" cy="560" r="180" fill="${C.white}" opacity="0.35"/>` + icon('CarFront', CX, 560, 220, C.deep, 1.8), { s: pop(t, 0.1, 0.6), cx: CX, cy: 560 }) +
    rise(lines(K.intro, { cy: 880, size: 128, fill: C.deep }), enter(t, 0.35, 0.45)) + chips;
}

// Phone part: t from 0 (44.47 s) to 12. Publish 0…4, requests 4…12 (arrivals, then confirmations).
function app(t) {
  const onPublish = t < 4, p = (t - 3.65) / 0.35;
  const screen = onPublish && p > 0 ? slide(publish(t), requests(t - 4), p) : onPublish ? publish(t) : requests(t - 4);
  const lift = onPublish ? enter(t, TAP - 0.7, 0.5) * leave(t, 3.85, 0.5) : 0;
  const cam = 420 * (1 - enter(t, 0, 0.6)) - 360 * lift;
  const i = t < 4 ? 0 : t < 8 ? 1 : 2, local = t - [0, 4, 8][i];
  return bg(SOFT) + phone(screen, { cam }) + g(step(i + 1, K.steps[i]), { o: Math.min(enter(local, 0.05, 0.3), 1 - lift) });
}

// Solutions: no waiting at the pitak, passengers for the way back too. A full car of people.
function outro(t) {
  const seats = PEOPLE.map((fill, i) => {
    const x = 180 + i * 186;
    return `<rect x="${x}" y="800" width="150" height="150" rx="36" fill="${fill}"/>` + icon('User', x + 75, 875, 84, C.white, 2.2);
  }).join('');
  const art = (name) => `<circle cx="${CX}" cy="520" r="130" fill="${C.amber}" opacity="0.18"/>` + icon(name, CX, 520, 150, C.amberStrong, 1.8);
  const strike = `<line x1="440" y1="620" x2="640" y2="420" stroke="${C.teal}" stroke-width="16" stroke-linecap="round" stroke-dasharray="290" stroke-dashoffset="${(290 * (1 - enter(t, 0.4, 0.4))).toFixed(1)}"/>`;
  return bg(C.white) + g(art('Hourglass') + strike, { o: span(t, -1, 2, 0.25) }) + g(art('Repeat'), { o: span(t, 2, 99, 0.25) }) + seats +
    K.outro.map((l, i) => rise(lines(l, { cy: 1180, size: 84 }), span(t, i * 2 + 0.1, i ? 99 : 2, 0.25), 30)).join('');
}

export function driver(t) {
  if (t < 4) return intro(t);
  if (t < 16) return app(t - 4);
  return outro(t - 16);
}
