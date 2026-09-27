// Trip page: route, driver, car, price; the seat request and the driver's confirmation.
import { C } from '../../lib/palette.mjs';
import { COPY, pop } from '../kit.mjs';
import { ui, tap, mainButton, UI } from '../phone.mjs';
import { section, cell, badge, avatar, star, TINT } from '../ui.mjs';
import { icon } from '../icons.mjs';

const K = COPY.trip, R = COPY.results.trips[0], { from, to } = COPY.concept;
const TAP = 1.0, CONFIRM = 2.0; // local seconds

function route() {
  return section(102, 126) + ui(R.time, 28, 142, { size: 18, weight: 700 }) + ui(R.arrive, 28, 206, { size: 18, weight: 700 }) +
    `<circle cx="96" cy="136" r="7" fill="${C.teal}"/><line x1="96" y1="148" x2="96" y2="188" stroke="${C.teal}" stroke-width="3" stroke-dasharray="5 5"/>` +
    `<circle cx="96" cy="200" r="7" fill="${C.amber}"/>` + ui(from, 118, 142, { size: 18, weight: 500 }) + ui(to, 118, 206, { size: 18, weight: 500 }) +
    ui(COPY.search.date, 118, 164, { size: 13, fill: C.muted });
}

function driver() {
  return section(240, 104) + avatar(R.name[0], 50, 292, 24) + ui(R.name, 86, 280, { size: 18, weight: 500 }) +
    star(92, 298, 6.5) + ui(`${R.rating} · ${K.trips}`, 103, 303, { size: 13, fill: C.muted }) +
    badge(K.verifiedDriver, 86, 326, { bg: TINT.teal, fg: UI.accentText, iconName: 'BadgeCheck' }).svg;
}

function status(t) {
  if (t < TAP + 0.25) return '';
  const ok = t >= CONFIRM, p = pop(t, ok ? CONFIRM : TAP + 0.25, 0.45);
  const body = section(500, 64) + icon(ok ? 'CircleCheckBig' : 'Clock', 42, 532, 26, ok ? C.teal : C.muted, 2.2) +
    ui(ok ? K.confirmed : K.sent, 70, 538, { size: 17, weight: 500, fill: ok ? UI.accentText : C.ink });
  return `<g opacity="${Math.min(1, p).toFixed(3)}" transform="translate(195 532) scale(${(0.9 + 0.1 * p).toFixed(3)}) translate(-195 -532)">${body}</g>`;
}

export function trip(t) {
  return route() + driver() + section(356, 128) +
    cell(356, { iconName: 'CarFront', label: K.carLabel, value: K.car }) +
    cell(420, { iconName: 'Banknote', label: K.price, value: R.price, last: true }) + status(t) +
    mainButton(K.button, { pressed: t >= TAP && t < TAP + 0.25, o: t >= CONFIRM ? 0.45 : 1 }) + tap(t, TAP, 195, 783);
}
