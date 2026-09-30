// 92.75 → 112.56 s: sunset and home, the crowd that becomes the R, the logo, and the end card.
import { C } from '../../lib/palette.mjs';
import { text } from '../../lib/text.mjs';
import { COPY, pill, rise, g, enter, pop, leave, SOFT, CX } from '../kit.mjs';
import { iconOf } from '../icons.mjs';
import { words } from '../type.mjs';
import { sky, mountains, perspectiveRoad, bokeh, SKY } from '../world.mjs';
import { flash, rings, rays, sweep } from '../fx.mjs';
import { crowd } from '../people.mjs';
import { logo } from './reveal.mjs';
import { prog, outCubic } from '../../lib/ease.mjs';

const K = COPY.finale;
const LOGO_Y = 560, HORIZON = 900;

// A small house on the horizon; the windows light up when the traveler arrives.
function house(t, lit) {
  const x = CX, y = HORIZON, glow = enter(t, lit, 0.4);
  return `<path d="M${x - 90} ${y - 70}L${x} ${y - 140}L${x + 90} ${y - 70}Z" fill="${C.amberStrong}"/>` +
    `<rect x="${x - 70}" y="${y - 72}" width="140" height="72" fill="${C.white}"/><rect x="${x - 12}" y="${y - 44}" width="24" height="44" fill="${C.deep}"/>` +
    [x - 48, x + 26].map((wx) => `<rect x="${wx}" y="${y - 58}" width="22" height="20" fill="${glow > 0 ? C.amber : C.slateLight}"/>` +
      `<circle cx="${wx + 11}" cy="${y - 48}" r="${(40 * glow).toFixed(1)}" fill="${C.amber}" opacity="${(0.25 * glow).toFixed(3)}"/>`).join('');
}

// 92.75 → 95.4 s: the music drops; the sun sets, a road leads home, the family gets "Yetib keldi".
export function pause(t) {
  const sunY = HORIZON - 90 + 70 * enter(t, 0, 2.6);
  return sky(SKY.sunset) + `<circle cx="${CX + 230}" cy="${sunY.toFixed(1)}" r="110" fill="${C.amber}" opacity="0.85"/>` +
    mountains(t, { y: HORIZON - 40, speed: 4, amp: 90, seed: 11, color: C.amberStrong, opacity: 0.18 }) +
    `<rect y="${HORIZON}" width="1080" height="1020" fill="${C.sunsetLight}"/>` + perspectiveRoad(t, { horizon: HORIZON, color: C.sand, speed: 0.3 }) +
    house(t, 1.7) + words(K.pause, t, 0.3, { cy: 360, size: 104, stagger: 0.2, dur: 0.8 }) +
    g(pill(COPY.trust.shareSteps[2], { cy: 700, size: 44, bg: SOFT, fg: C.teal, iconSvg: iconOf('CircleCheckBig', 2.4) }), { s: pop(t, 1.7, 0.45), cx: CX, cy: 700 }) +
    rings(t, 1.7, CX, 700, { color: C.teal, max: 220 });
}

// 95.4 → 105 s: people burst over the frame on the hit, gather into the R, and the R becomes the logo.
export function finale(t) {
  const text1 = leave(t, 2.3, 0.4), shrink = outCubic(prog(t, 3.9, 4.6)), fade = leave(t, 4.8, 0.4);
  const s = 1 - (1 - 0.245) * shrink, dy = (LOGO_Y - 960) * shrink;
  const pulse = t > 7.07 ? 0.02 * Math.max(0, 1 - ((t - 7.07) % 1) * 4) : 0;
  return sky(SKY.teal) + rays(t, CX, t < 4 ? 960 : LOGO_Y, { opacity: 0.07 }) + bokeh(t, { colors: [C.white, C.amber], opacity: 0.07 }) +
    flash(t, 0.41) + rings(t, 0.41, CX, 960) +
    g(words(K.people.slice(0, 1), t, 0.41, { cy: 330, size: 116, fill: C.white, accent: C.amber }) +
      words(K.people.slice(1), t, 1.08, { cy: 470, size: 116, fill: C.white }), { o: text1 }) +
    (t >= 4.2 ? g(logo(t - 4.2, { cy: LOGO_Y }), { s: 1 + pulse, cx: CX, cy: LOGO_Y }) : '') +
    g(crowd(t, { burst: 0.41, gather: 2.2 }), { o: fade, s, cx: CX, cy: 960, y: dy }) +
    rings(t, 7.07, CX, LOGO_Y, { max: 400 }) + rings(t, 8.07, CX, LOGO_Y, { max: 400 }) +
    words([K.tagline], t, 6.3, { cy: 1250, size: 60, fill: C.white, stagger: 0.05 });
}

// 105 → 112.56 s: the end card holds while the music fades out.
export function end(t) {
  return sky(SKY.teal) + rays(t + 9.6, CX, LOGO_Y, { opacity: 0.07 }) + bokeh(t + 9.6, { colors: [C.white, C.amber], opacity: 0.07 }) +
    logo(99, { cy: LOGO_Y }) + sweep(t, 1.2, CX - 150, LOGO_Y - 150, 300, 'endSweep') +
    text(K.tagline, { x: CX, y: 1250, anchor: 'middle', fill: C.white, weight: 800, size: 60 }) +
    g(pill(K.bot, { cy: 1400, size: 50, iconSvg: iconOf('Send', 2.4) }), { s: pop(t, 0.3, 0.5), cx: CX, cy: 1400 }) +
    rise(text(K.site, { x: CX, y: 1545, anchor: 'middle', fill: C.mint, weight: 600, size: 56 }), enter(t, 0.8, 0.5), 20) +
    text(K.credit, { x: CX, y: 1760, anchor: 'middle', fill: C.mint, weight: 500, size: 26, maxWidth: 900 });
}
