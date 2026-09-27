// Search results: trip cards with time, driver, rating, car, badges, seats and price.
import { C } from '../../lib/palette.mjs';
import { COPY, enter } from '../kit.mjs';
import { ui, tap, UI } from '../phone.mjs';
import { section, badge, avatar, star, TINT } from '../ui.mjs';

const K = COPY.results;
const AVATAR = [C.teal, C.deep, C.amberStrong];

function card(trip, i, y) {
  const verified = badge(K.verified, 28, y + 120, { bg: TINT.teal, fg: UI.accentText, iconName: 'BadgeCheck' });
  return section(y, 138) + ui(trip.time, 28, y + 36, { size: 21, weight: 700 }) + ui(`→ ${trip.arrive}`, 94, y + 36, { size: 15, fill: C.muted }) +
    ui(trip.price, 362, y + 36, { size: 18, weight: 700, fill: UI.accentText, anchor: 'end' }) +
    avatar(trip.name[0], 46, y + 78, 18, AVATAR[i]) + ui(trip.name, 74, y + 74, { size: 16, weight: 500 }) +
    star(80, y + 92, 6.5) + ui(`${trip.rating} · ${trip.car}`, 91, y + 97, { size: 13, fill: C.muted }) + verified.svg +
    (trip.woman ? badge(COPY.search.woman, 36 + verified.w, y + 120, { bg: TINT.amber, fg: C.ink }).svg : '') +
    ui(trip.seats, 362, y + 124, { size: 14, fill: C.muted, anchor: 'end' });
}

export function results(t) {
  const all = badge(K.all, 20, 184, { bg: C.teal, fg: C.white, size: 14 });
  const cards = K.trips.map((trip, i) => {
    const p = enter(t, 0.1 + i * 0.12, 0.4), y = 210 + i * 150;
    return `<g opacity="${p.toFixed(3)}" transform="translate(0 ${(30 * (1 - p)).toFixed(1)})">${card(trip, i, y)}</g>`;
  }).join('');
  return ui(K.route, 20, 126, { size: 21, weight: 700 }) + ui(K.sub, 20, 150, { size: 14, fill: C.muted }) + all.svg +
    badge(COPY.search.woman, 28 + all.w, 184, { bg: C.white, fg: C.ink, size: 14 }).svg + cards + tap(t, 2.6, 195, 270);
}
