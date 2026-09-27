// Rida chat with the driver: the phone number stays hidden, people write inside the app.
import { C } from '../../lib/palette.mjs';
import { COPY, SOFT, enter } from '../kit.mjs';
import { ui, tap, UI } from '../phone.mjs';
import { badge, avatar, bubble, TINT } from '../ui.mjs';
import { icon } from '../icons.mjs';
import { layout } from '../../lib/text.mjs';

const K = COPY.chat, R = COPY.results.trips[0];
const IN_AT = 0.6, OUT_AT = 1.9, CALL_AT = 2.6; // local seconds

function typing(t, t0) {
  if (t < t0 - 0.5 || t >= t0) return '';
  const dots = [0, 1, 2].map((i) => `<circle cx="${34 + i * 12}" cy="222" r="4" fill="${C.muted}" opacity="${(0.4 + 0.6 * Math.abs(Math.sin(t * 8 + i))).toFixed(2)}"/>`);
  return `<rect x="14" y="204" width="68" height="36" rx="18" fill="${C.white}"/>${dots.join('')}`;
}

function callLog(y) {
  const w = layout(K.call, { family: 'roboto', weight: 500, size: 14 }).width + 44;
  return `<rect x="${(195 - w / 2).toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="30" rx="15" fill="${C.white}"/>` +
    icon('PhoneOutgoing', 195 - w / 2 + 18, y + 15, 14, C.teal, 2.4) + ui(K.call, 195 - w / 2 + 32, y + 20, { size: 14, weight: 500, fill: C.ink });
}

export function chat(t) {
  const hiddenW = layout(K.hidden, { family: 'roboto', weight: 500, size: 14 }).width + 34;
  const incoming = bubble(K.incoming, 204, { time: '21:04' }), outgoing = bubble(K.outgoing, 216 + incoming.h, { side: 'out', time: '21:05' });
  const show = (svg, t0) => `<g opacity="${enter(t, t0, 0.25).toFixed(3)}">${svg}</g>`;
  return `<rect y="86" width="390" height="740" fill="${SOFT}"/><rect y="86" width="390" height="62" fill="${C.white}"/>` +
    avatar(R.name[0], 40, 117, 20) + ui(R.name, 72, 113, { size: 17, weight: 500 }) + ui(K.subtitle, 72, 134, { size: 13, fill: C.muted }) +
    `<rect y="147" width="390" height="1" fill="${UI.line}"/>` +
    badge(K.hidden, 195 - hiddenW / 2, 176, { bg: TINT.teal, fg: UI.accentText, iconName: 'Lock', size: 14 }).svg +
    `<circle cx="350" cy="117" r="20" fill="rgba(13,148,136,0.12)"/>` + icon('Phone', 350, 117, 20, C.teal, 2.2) + tap(t, CALL_AT, 350, 117) +
    typing(t, IN_AT) + show(incoming.svg, IN_AT) + show(outgoing.svg, OUT_AT) + show(callLog(232 + incoming.h + outgoing.h), CALL_AT + 0.4) +
    `<rect y="765" width="390" height="60" fill="${C.white}"/>` + ui(K.input, 24, 800, { size: 16, fill: C.muted }) + icon('Send', 360, 795, 24, C.teal);
}
