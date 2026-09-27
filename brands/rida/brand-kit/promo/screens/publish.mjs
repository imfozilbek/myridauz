// Driver publishes a trip: route, time, free seats, price with the recommendation.
import { C } from '../../lib/palette.mjs';
import { COPY, pop } from '../kit.mjs';
import { ui, tap, mainButton, UI } from '../phone.mjs';
import { section, cell, title } from '../ui.mjs';
import { icon } from '../icons.mjs';

const K = COPY.publish, { from, to } = COPY.concept, S = COPY.search;
const PLUS = [0.8, 1.3], HINT = 1.8; // local seconds
export const TAP = 2.9;

function stepper(seats) {
  const btn = (x, name) => `<circle cx="${x}" cy="392" r="17" fill="rgba(13,148,136,0.12)"/>` + icon(name, x, 392, 18, C.teal, 2.6);
  return btn(274, 'Minus') + ui(String(seats), 314, 400, { size: 20, weight: 700, anchor: 'middle' }) + btn(354, 'Plus');
}

function toast(t) {
  const p = pop(t, TAP + 0.2, 0.4);
  if (p <= 0) return '';
  const body = `<rect x="70" y="672" width="250" height="48" rx="24" fill="${C.ink}"/>` + icon('CircleCheckBig', 100, 696, 22, C.mint, 2.2) +
    ui(K.done, 122, 702, { size: 16, weight: 500, fill: C.white });
  return `<g opacity="${Math.min(1, p).toFixed(3)}" transform="translate(0 ${(20 * (1 - p)).toFixed(1)})">${body}</g>`;
}

export function publish(t) {
  const seats = 1 + PLUS.filter((at) => t >= at).length;
  const hint = pop(t, HINT, 0.45);
  return title(K.title) + section(152, 192) +
    cell(152, { iconName: 'MapPin', iconColor: C.teal, label: S.from, value: from }) +
    cell(216, { iconName: 'MapPin', iconColor: C.amber, label: S.to, value: to }) +
    cell(280, { iconName: 'Clock', label: S.when, value: K.time, last: true }) +
    section(360, 64) + ui(K.seats, 28, 398, { size: 17 }) + stepper(seats) +
    section(440, 116) + cell(440, { iconName: 'Banknote', label: K.price, value: COPY.results.trips[0].price, last: true }) +
    `<g opacity="${Math.min(1, hint).toFixed(3)}">` + icon('Lightbulb', 40, 532, 20, C.amberStrong, 2.2) +
    ui(K.hint, 68, 537, { size: 14, fill: UI.accentText, weight: 500 }) + '</g>' +
    PLUS.map((at) => tap(t, at, 354, 392)).join('') + toast(t) +
    mainButton(K.button, { pressed: t >= TAP && t < TAP + 0.25 }) + tap(t, TAP, 195, 783);
}
