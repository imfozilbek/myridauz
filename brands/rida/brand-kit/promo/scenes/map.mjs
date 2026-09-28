// 76.47 → 88.47 s: all of Uzbekistan. Routes from Toshkent, 13 regional channels, route subscription.
import fs from 'node:fs';
import { C } from '../../lib/palette.mjs';
import { text, markR } from '../../lib/text.mjs';
import { squircle } from '../../lib/brand.mjs';
import { channelAvatar } from '../../lib/channels.mjs';
import { COPY, rise, g, enter, pop, span, CX } from '../kit.mjs';
import { words } from '../type.mjs';
import { sky, bokeh, SKY } from '../world.mjs';
import { prog, outCubic } from '../../lib/ease.mjs';
import { icon } from '../icons.mjs';

const read = (path) => JSON.parse(fs.readFileSync(new URL(path, import.meta.url), 'utf8'));
const MAP = read('../../data/uzbekistan.json'), REGIONS = read('../../data/regions.json');
const K = COPY.map, S = 0.98, X0 = 50, Y0 = 600;
const at = (c) => [X0 + c.x * S, Y0 + c.y * S];
const HUB = at(MAP.cities.find((c) => !c.code)), DEST = MAP.cities.filter((c) => c.code);
const LABELS = { toshkent: [0, -36], nukus: [0, -30], urganch: [0, 50], buxoro: [0, 52], navoiy: [-10, -28], samarqand: [30, 52], qarshi: [-20, 52], termiz: [70, 12], fargona: [0, 52], namangan: [-10, -30] };

// Quadratic route from Toshkent bending north; returns the path and a point at u (0 → 1).
function route(c) {
  const [x, y] = at(c), [hx, hy] = HUB, mx = (hx + x) / 2, my = (hy + y) / 2, len = Math.hypot(x - hx, y - hy);
  const cx = mx + ((y - hy) / (len || 1)) * len * 0.18, cy = my - (Math.abs(x - hx) / (len || 1)) * len * 0.18;
  const point = (u) => [(1 - u) ** 2 * hx + 2 * (1 - u) * u * cx + u * u * x, (1 - u) ** 2 * hy + 2 * (1 - u) * u * cy + u * u * y];
  return { d: `M${hx} ${hy}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`, point };
}

function map(t, { dim = 1, highlight } = {}) {
  const regions = `<g transform="translate(${X0} ${Y0}) scale(${S})">` +
    MAP.regions.map((r) => `<path d="${r.d}" fill="${C.mint}" stroke="${C.white}" stroke-width="3" stroke-linejoin="round"/>`).join('') + '</g>';
  const routes = DEST.map((c, i) => {
    const r = route(c), p = enter(t, 0.8 + i * 0.12, 0.7), hot = highlight === c.id;
    const comet = p >= 1 && !highlight ? [0, 1, 2, 3, 4].map((k) => {
      const [x, y] = r.point((((t * 0.35 + i * 0.17 - k * 0.018) % 1) + 1) % 1);
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${7 - k}" fill="${C.amber}" opacity="${(1 - k * 0.2).toFixed(2)}"/>`;
    }).join('') : '';
    return `<path d="${r.d}" fill="none" stroke="${hot ? C.amber : C.teal}" stroke-width="16" opacity="${(0.12 * p).toFixed(3)}" stroke-linecap="round"/>` +
      `<path d="${r.d}" fill="none" stroke="${hot ? C.amber : C.teal}" stroke-width="${hot ? 9 : 4}" stroke-linecap="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="${(1 - p).toFixed(3)}" opacity="${hot || !highlight ? 1 : 0.35}"/>` +
      comet +
      g(`<circle cx="${at(c)[0]}" cy="${at(c)[1]}" r="10" fill="${hot ? C.amber : C.teal}"/>`, { s: pop(t, 1.4 + i * 0.12, 0.4), cx: at(c)[0], cy: at(c)[1] });
  }).join('');
  const labels = Object.entries(LABELS).map(([id, [dx, dy]]) => {
    const c = MAP.cities.find((x) => x.id === id), [x, y] = at(c);
    return text(c.name, { x: x + dx, y: y + dy, anchor: 'middle', fill: id === 'toshkent' ? C.ink : C.muted, weight: id === 'toshkent' ? 800 : 600, size: id === 'toshkent' ? 34 : 26 });
  }).join('');
  const pulse = (t % 1) * 60;
  return g(g(regions, { o: enter(t, 0, 0.6) }) + routes + g(labels, { o: enter(t, 1.2, 0.5) }) +
    `<circle cx="${HUB[0]}" cy="${HUB[1]}" r="${16 + pulse}" fill="none" stroke="${C.teal}" stroke-width="4" opacity="${(1 - pulse / 60).toFixed(2)}"/>` +
    `<circle cx="${HUB[0]}" cy="${HUB[1]}" r="16" fill="${C.teal}"/>`, { o: dim });
}

// 13 channel avatars (docs/37) in rows of 4, 5, 4.
function channels(t) {
  const rows = [REGIONS.slice(0, 4), REGIONS.slice(4, 9), REGIONS.slice(9)];
  return rows.map((row, ri) => row.map((r, j) => {
    const cx = CX + (j - (row.length - 1) / 2) * 200, cy = 720 + ri * 210, id = `ch${ri}${j}`, k = ri * 5 + j;
    const svg = channelAvatar(r).replace('<svg ', `<svg x="${cx - 90}" y="${cy - 90}" `).replace('width="640" height="640"', 'width="180" height="180"');
    const p = outCubic(prog(t, 0.1 + k * 0.08, 0.7 + k * 0.08)), a = k * 2.4, fx = cx + Math.cos(a) * 1000 * (1 - p), fy = cy + Math.sin(a) * 1000 * (1 - p);
    const av = `<clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="90"/></clipPath><g clip-path="url(#${id})">${svg}</g>`;
    return p > 0 ? `<g transform="translate(${(fx - cx).toFixed(1)} ${(fy - cy).toFixed(1)}) rotate(${(-60 * (1 - p)).toFixed(1)} ${cx} ${cy})">${av}</g>` : '';
  }).join('')).join('');
}

function notice(t) {
  const p = enter(t, 0.5, 0.45), y = 1300;
  const body = `<rect x="110" y="${y}" width="860" height="180" rx="40" fill="${C.white}" stroke="${C.line}" stroke-width="2"/>` +
    squircle(150, y + 40, 100, C.teal) + markR({ cx: 200, cy: y + 90, h: 62, fill: C.white }) +
    text(K.notice[0], { x: 280, y: y + 82, fill: C.ink, weight: 600, size: 38, maxWidth: 560 }) +
    text(K.notice[1], { x: 280, y: y + 132, fill: C.muted, weight: 600, size: 34 }) +
    g(icon('BellRing', 905, y + 60, 44, C.amberStrong, 2.2), { x: Math.sin(t * 40) * 3 * (1 - enter(t, 1.2, 0.4)) });
  return g(body, { o: p, y: -40 * (1 - p) });
}

export function uzMap(t) {
  const part = Math.min(2, Math.floor(t / 4)), local = t - part * 4;
  const head = [K.all, K.channels, K.subscribe][part];
  const zoom = 1 + 1.6 * (1 - outCubic(prog(t, 0, 1.8)));
  let body = sky(SKY.day) + bokeh(t, { opacity: 0.06, seed: 8 }) +
    g(map(t, { dim: part === 1 ? 0.2 : 1, highlight: part === 2 ? 'buxoro' : undefined }), { s: zoom, cx: HUB[0], cy: HUB[1] });
  if (part === 1) body += channels(local);
  if (part === 2) body += notice(local) + rise(text(K.subscribeSub, { x: CX, y: 530, anchor: 'middle', fill: C.muted, weight: 600, size: 44 }), enter(local, 0.3, 0.4), 20);
  return body + g(words(head, local, 0.05, { cy: 360, size: 88 }), { o: span(local, -1, 4.05, 0.25) });
}
