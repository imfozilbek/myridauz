// Rida chat with the driver: the phone number stays hidden, people write inside the app.
import { C } from '../../lib/palette.mjs';
import { COPY, SOFT, enter } from '../kit.mjs';
import { ui, UI } from '../phone.mjs';
import { badge, avatar, bubble, TINT } from '../ui.mjs';
import { icon } from '../icons.mjs';
import { layout } from '../../lib/text.mjs';

const K = COPY.chat, R = COPY.results.trips[0];
const IN_AT = 0.6, OUT_AT = 1.9; // local seconds

function typing(t, t0) {
  if (t < t0 - 0.5 || t >= t0) return '';
  const dots = [0, 1, 2].map((i) => `<circle cx="${34 + i * 12}" cy="222" r="4" fill="${C.muted}" opacity="${(0.4 + 0.6 * Math.abs(Math.sin(t * 8 + i))).toFixed(2)}"/>`);
  return `<rect x="14" y="204" width="68" height="36" rx="18" fill="${C.white}"/>${dots.join('')}`;
}

export function chat(t) {
  const hiddenW = layout(K.hidden, { family: 'roboto', weight: 500, size: 14 }).width + 34;
  const incoming = bubble(K.incoming, 204, { time: '21:04' }), outgoing = bubble(K.outgoing, 216 + incoming.h, { side: 'out', time: '21:05' });
  const show = (svg, t0) => `<g opacity="${enter(t, t0, 0.25).toFixed(3)}">${svg}</g>`;
  return `<rect y="86" width="390" height="740" fill="${SOFT}"/><rect y="86" width="390" height="62" fill="${C.white}"/>` +
    avatar(R.name[0], 40, 117, 20) + ui(R.name, 72, 113, { size: 17, weight: 500 }) + ui(K.subtitle, 72, 134, { size: 13, fill: C.muted }) +
    `<rect y="147" width="390" height="1" fill="${UI.line}"/>` +
    badge(K.hidden, 195 - hiddenW / 2, 176, { bg: TINT.teal, fg: UI.accentText, iconName: 'Lock', size: 14 }).svg +
    typing(t, IN_AT) + show(incoming.svg, IN_AT) + show(outgoing.svg, OUT_AT) +
    `<rect y="765" width="390" height="60" fill="${C.white}"/>` + ui(K.input, 24, 800, { size: 16, fill: C.muted }) + icon('Send', 360, 795, 24, C.teal);
}
