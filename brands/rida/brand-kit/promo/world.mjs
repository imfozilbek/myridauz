// Living backdrop: sky, mountains with parallax, roads, drifting light, vignette.
import { C } from '../lib/palette.mjs';
import { W, H } from './kit.mjs';

export const SKY = {
  grey: [C.skyGrey, C.skyGreyLight], day: [C.mint, C.white], soft: [C.mintSoft, C.soft],
  sunset: [C.sunset, C.sunsetLight], teal: [C.teal, C.deep], amber: [C.amber, C.amberLight]
};
const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
// Blend two hex colors, p from 0 (a) to 1 (b).
export function mix(a, b, p) {
  const [x, y] = [hex(a), hex(b)];
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * p).toString(16).padStart(2, '0')).join('');
}
export function sky([top, bottom], id = 'sky') {
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs>` +
    `<rect width="${W}" height="${H}" fill="url(#${id})"/>`;
}

// Mountain ridge from a sum of sines, repeated every `period` px so it can scroll without seams.
const ridges = {};
function ridge(seed, amp, period) {
  const key = `${seed}-${amp}-${period}`;
  if (!ridges[key]) {
    const pts = [];
    for (let x = 0; x <= period * 2 + W; x += 12) {
      const k = (2 * Math.PI * x) / period;
      pts.push(`${x} ${(-amp * (0.55 * Math.sin(k * 2 + seed) + 0.3 * Math.sin(k * 5 + seed * 2) + 0.15 * Math.sin(k * 11 + seed * 3))).toFixed(1)}`);
    }
    ridges[key] = pts.join('L');
  }
  return ridges[key];
}
// Mountains layer: base line y, scrolling left at `speed` px/s.
export function mountains(t, { y, speed = 20, amp = 90, seed = 1, period = 900, color = C.teal, opacity = 0.15 }) {
  const x = -((t * speed) % period);
  return `<path transform="translate(${x.toFixed(1)} ${y})" d="M0 ${H}L${ridge(seed, amp, period)}L${period * 2 + W} ${H}Z" fill="${color}" opacity="${opacity}"/>`;
}

// Straight road across the frame with dashes moving left.
export function road(t, { y, speed = 260, color = C.slate, dash = C.white, opacity = 1 }) {
  const off = (t * speed) % 120;
  const dashes = Array.from({ length: 11 }, (_, i) => `<rect x="${(i * 120 - off).toFixed(1)}" y="${y + 36}" width="60" height="8" rx="4" fill="${dash}"/>`).join('');
  return `<g opacity="${opacity}"><rect y="${y}" width="${W}" height="80" fill="${color}"/>${dashes}</g>`;
}

// Road going to the horizon; dashes come toward the viewer.
export function perspectiveRoad(t, { horizon = 900, color = C.slateLight, dash = C.white, speed = 0.6 }) {
  const quad = (z0, z1, w) => {
    const y0 = horizon + (H - horizon) * z0 * z0, y1 = horizon + (H - horizon) * z1 * z1;
    const w0 = 8 + w * z0 * z0, w1 = 8 + w * z1 * z1;
    return `M${W / 2 - w0} ${y0.toFixed(1)}L${W / 2 + w0} ${y0.toFixed(1)}L${W / 2 + w1} ${y1.toFixed(1)}L${W / 2 - w1} ${y1.toFixed(1)}Z`;
  };
  let dashes = '';
  for (let i = 0; i < 8; i++) {
    const z = ((i / 8 + t * speed * 0.25) % 1);
    dashes += quad(z, Math.min(1, z + 0.045), 16);
  }
  return `<path d="${quad(0, 1, 520)}" fill="${color}"/><path d="${dashes}" fill="${dash}"/>`;
}

// Soft circles of light drifting up (bokeh).
export function bokeh(t, { count = 14, colors = [C.teal, C.amber], opacity = 0.12, seed = 3 } = {}) {
  let out = '';
  for (let i = 0; i < count; i++) {
    const r = 40 + ((i * 37 + seed * 11) % 90), x = (i * 211 + seed * 97) % W, speed = 18 + (i % 5) * 7;
    const y = H + r - ((t * speed + i * 260) % (H + 2 * r));
    out += `<circle cx="${x}" cy="${y.toFixed(1)}" r="${r}" fill="${colors[i % colors.length]}" opacity="${opacity}"/>`;
  }
  return out;
}

export const VIGNETTE = `<defs><radialGradient id="vig" cx="0.5" cy="0.45" r="0.75"><stop offset="0.6" stop-color="${C.shadow}" stop-opacity="0"/>` +
  `<stop offset="1" stop-color="${C.shadow}" stop-opacity="0.16"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#vig)"/>`;

// Calm stage behind the phone scenes: soft sky, far mountains, drifting light.
export const stage = (t, tint = C.teal) => sky(SKY.soft, 'stage') + mountains(t, { y: 1500, speed: 8, amp: 140, seed: 9, color: tint, opacity: 0.08 }) +
  bokeh(t, { colors: [tint, C.amber], opacity: 0.07, seed: 5 });
