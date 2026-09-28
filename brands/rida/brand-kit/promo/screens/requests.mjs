// Driver's trip: passengers send seat requests, the driver confirms, the car fills up.
import { C } from '../../lib/palette.mjs';
import { COPY, pop, enter } from '../kit.mjs';
import { ui, tap, UI } from '../phone.mjs';
import { section, title, avatar, star, badge } from '../ui.mjs';
import { icon } from '../icons.mjs';

const K = COPY.requests, { from, to } = COPY.concept;
const ARRIVE = [1, 2, 3], CONFIRM = [4.5, 5.5, 6.5], FULL = 7; // seconds from the start of this screen
const COLORS = [C.amberStrong, C.teal, C.deep];

function seats(t) {
  return [0, 1, 2].map((i) => {
    const p = pop(t, CONFIRM[i] + 0.15, 0.4), x = 28 + i * 38;
    return `<rect x="${x}" y="230" width="30" height="30" rx="8" fill="none" stroke="${C.slateLight}" stroke-width="2" stroke-dasharray="4 3"/>` +
      (p > 0 ? `<g transform="translate(${x + 15} 245) scale(${p.toFixed(3)}) translate(${-x - 15} -245)"><rect x="${x}" y="230" width="30" height="30" rx="8" fill="${C.teal}"/>` +
        icon('User', x + 15, 245, 18, C.white, 2.4) + '</g>' : '');
  }).join('');
}

function request(t, person, i) {
  const p = enter(t, ARRIVE[i], 0.35), y = 306 + i * 78, done = t >= CONFIRM[i] + 0.15;
  if (p <= 0) return '';
  const action = done ? icon('CircleCheckBig', 344, y + 34, 28, C.teal, 2.2)
    : `<rect x="262" y="${y + 17}" width="104" height="34" rx="17" fill="${C.teal}"/>` + ui(K.confirm, 314, y + 39, { size: 14, weight: 500, fill: C.white, anchor: 'middle' });
  const row = section(y, 68) + avatar(person.name[0], 48, y + 34, 20, COLORS[i]) + ui(person.name, 80, y + 30, { size: 17, weight: 500 }) +
    star(84, y + 47, 6) + ui(`${person.rating} · ${COPY.search.oneSeat}`, 95, y + 52, { size: 13, fill: C.muted }) + action + tap(t, CONFIRM[i], 314, y + 34);
  return `<g opacity="${p.toFixed(3)}" transform="translate(0 ${(-24 * (1 - p)).toFixed(1)})">${row}</g>`;
}

export function requests(t) {
  const full = pop(t, FULL, 0.5);
  return title(K.title) + section(152, 124) + ui(`${from} → ${to}`, 28, 190, { size: 19, weight: 700 }) +
    ui(K.time, 28, 214, { size: 14, fill: C.muted }) + seats(t) +
    (full > 0 ? `<g opacity="${Math.min(1, full).toFixed(3)}">${badge(K.full, 150, 245, { bg: C.teal, fg: C.white, iconName: 'Check', size: 14 }).svg}</g>` : '') +
    ui(K.new, 28, 298, { size: 14, weight: 500, fill: UI.accentText }) + K.people.map((person, i) => request(t, person, i)).join('');
}
