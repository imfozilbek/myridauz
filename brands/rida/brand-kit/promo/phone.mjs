// Phone with Telegram around the app. Screens are drawn in points (390 pt wide) and scaled to the frame.
import { C } from '../lib/palette.mjs';
import { text } from '../lib/text.mjs';
import { prog, outCubic } from '../lib/ease.mjs';
import { icon } from './icons.mjs';

const PT_W = 390, PT_H = 825;
export const UI = { bg2: '#F2F3F5', line: '#E5E7EB', accentText: '#0F766E' };
const F = { x: 190, y: 380, w: 700, h: 1450, r: 90, bezel: 14 };
const K = (F.w - 2 * F.bezel) / PT_W;

// Roboto text in points (the system font of Telegram on Android).
export const ui = (str, x, y, { size = 16, weight = 400, fill = C.ink, anchor = 'start', maxWidth } = {}) =>
  text(str, { x, y, size, weight, fill, anchor, maxWidth, family: 'roboto' });

// Status bar and the Mini App header with the bot name (Telegram draws these).
export const statusBar = () => `<rect width="${PT_W}" height="86" fill="${C.white}"/>` + ui('9:41', 24, 21, { size: 14, weight: 500 }) +
  icon('Signal', 318, 16, 14, C.ink) + icon('Wifi', 338, 16, 14, C.ink) + icon('BatteryFull', 362, 16, 16, C.ink);
function chrome(title = 'Rida') {
  return statusBar() + icon('X', 28, 58, 22, C.muted) + ui(title, 60, 64, { size: 18, weight: 500 }) + icon('EllipsisVertical', 364, 58, 20, C.muted) +
    `<rect y="85" width="${PT_W}" height="1" fill="${UI.line}"/>`;
}

// Screen content (points) inside the phone. `cam` moves the phone up, `zoom` scales around frame
// height `fy` (camera push-in), `tilt` rotates in degrees. `withChrome` false for Telegram's own screens.
export function phone(content, { withChrome = true, title, cam = 0, zoom = 1, fy = 960, tilt = 0 } = {}) {
  const sx = F.x + F.bezel, sy = F.y + F.bezel, sw = F.w - 2 * F.bezel, sh = F.h - 2 * F.bezel, sr = F.r - F.bezel;
  const move = `translate(540 ${fy}) scale(${zoom.toFixed(4)}) rotate(${tilt.toFixed(2)}) translate(-540 ${-fy}) translate(0 ${cam.toFixed(1)})`;
  return `<g transform="${move}"><defs><clipPath id="screen"><rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="${sr}"/></clipPath>` +
    `<filter id="phoneShadow" x="-20%" y="-10%" width="140%" height="130%"><feDropShadow dx="0" dy="30" stdDeviation="34" flood-color="#0F172A" flood-opacity="0.22"/></filter></defs>` +
    `<rect x="${F.x}" y="${F.y}" width="${F.w}" height="${F.h}" rx="${F.r}" fill="#111827" filter="url(#phoneShadow)"/>` +
    `<g clip-path="url(#screen)"><g transform="translate(${sx} ${sy}) scale(${K.toFixed(5)})">` +
    `<rect width="${PT_W}" height="${PT_H}" fill="${UI.bg2}"/>${content}${withChrome ? chrome(title) : ''}` +
    `<rect x="${PT_W / 2 - 60}" y="${PT_H - 10}" width="120" height="4" rx="2" fill="${C.ink}" opacity="0.35"/></g></g></g>`;
}

// Push navigation: `a` slides left and dims while `b` comes from the right, p 0 → 1.
export function slide(a, b, p) {
  if (p <= 0) return a;
  if (p >= 1) return b;
  const e = outCubic(p);
  return `<g transform="translate(${(-0.3 * PT_W * e).toFixed(1)} 0)">${a}<rect width="${PT_W}" height="${PT_H}" fill="#000" opacity="${(0.15 * e).toFixed(3)}"/></g>` +
    `<g transform="translate(${(PT_W * (1 - e)).toFixed(1)} 0)"><rect width="${PT_W}" height="${PT_H}" fill="${UI.bg2}"/>${b}</g>`;
}

// Finger tap feedback at (x, y) points, starting at t0.
export function tap(t, t0, x, y) {
  const p = prog(t, t0, t0 + 0.45);
  if (p <= 0 || p >= 1) return '';
  return `<circle cx="${x}" cy="${y}" r="${(10 + 26 * outCubic(p)).toFixed(1)}" fill="${C.ink}" opacity="${(0.28 * (1 - p)).toFixed(3)}"/>`;
}

// Main button of the Mini App (bottom, full width).
export function mainButton(label, { pressed = false, o = 1 } = {}) {
  return `<g opacity="${o}"><rect x="16" y="757" width="358" height="52" rx="12" fill="${pressed ? C.deep : C.teal}"/>` +
    ui(label, PT_W / 2, 789, { size: 17, weight: 500, fill: C.white, anchor: 'middle' }) + '</g>';
}
