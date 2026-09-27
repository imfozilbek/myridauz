// Passenger search: from, to, date, seats, "Mashinada ayol bor", search button.
import { C } from '../../lib/palette.mjs';
import { COPY } from '../kit.mjs';
import { ui, tap, mainButton } from '../phone.mjs';
import { section, cell, title, toggle } from '../ui.mjs';

const K = COPY.search, { from, to } = COPY.concept;
const FILLED = [0.7, 1.45, 2.2]; // values appear right after each tap

export function search(t) {
  const value = (i, v) => (t >= FILLED[i] ? { value: v } : { value: K.choose, valueFill: C.muted });
  return title(K.title) + section(152, 256) +
    cell(152, { iconName: 'MapPin', iconColor: C.teal, label: K.from, ...value(0, from) }) +
    cell(216, { iconName: 'MapPin', iconColor: C.amber, label: K.to, ...value(1, to) }) +
    cell(280, { iconName: 'CalendarDays', label: K.when, ...value(2, K.date) }) +
    cell(344, { iconName: 'Users', label: K.seats, value: K.oneSeat, last: true }) +
    section(424, 56) + ui(K.woman, 28, 458, { size: 16 }) + toggle(318, 452, 0) +
    tap(t, 0.55, 200, 184) + tap(t, 1.3, 200, 248) + tap(t, 2.05, 200, 312) + mainButton(K.button);
}
