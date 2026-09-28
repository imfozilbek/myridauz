// App parts in points: sections, cells, badges, avatars, stars, toggles (Telegram look, Rida colors).
import { C } from '../lib/palette.mjs';
import { layout } from '../lib/text.mjs';
import { icon } from './icons.mjs';
import { ui, UI } from './phone.mjs';

export const section = (y, h, { x = 12, w = 366 } = {}) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${C.white}"/>`;
export const sep = (y, x = 68) => `<rect x="${x}" y="${y}" width="${378 - x}" height="1" fill="${UI.line}"/>`;
export const title = (str, y = 132) => ui(str, 20, y, { size: 26, weight: 700 });

// Two-line cell: icon, hint label, value. Returns markup for a 64 pt row at y.
export function cell(y, { iconName, iconColor = C.muted, label, value, valueFill = C.ink, last = false }) {
  return icon(iconName, 40, y + 32, 22, iconColor) + ui(label, 68, y + 26, { size: 13, fill: C.muted }) +
    ui(value, 68, y + 49, { size: 17, fill: valueFill }) + (last ? '' : sep(y + 64));
}

// Small rounded label with an icon; returns { svg, w } so rows can be laid out.
export function badge(label, x, y, { bg = C.white, fg = C.teal, iconName, size = 12 } = {}) {
  const tw = layout(label, { family: 'roboto', weight: 500, size }).width, iw = iconName ? size + 4 : 0, w = tw + iw + 16, h = size + 12;
  const svg = `<rect x="${x}" y="${y - h / 2}" width="${w.toFixed(1)}" height="${h}" rx="${h / 2}" fill="${bg}"/>` +
    (iconName ? icon(iconName, x + 8 + size / 2, y, size, fg, 2.4) : '') +
    ui(label, x + 8 + iw, y + size * 0.36, { size, weight: 500, fill: fg });
  return { svg, w };
}

export const avatar = (letter, cx, cy, r, fill = C.teal) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>` + ui(letter, cx, cy + r * 0.36, { size: r, weight: 500, fill: C.white, anchor: 'middle' });

export function star(cx, cy, r, fill = C.amber) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r;
    return `${(cx + rr * Math.cos(a)).toFixed(2)},${(cy + rr * Math.sin(a)).toFixed(2)}`;
  });
  return `<polygon points="${pts.join(' ')}" fill="${fill}"/>`;
}

// Telegram switch; p is how far it is turned on (0 → 1).
export function toggle(x, y, p) {
  const knob = x + 10 + 18 * p;
  return `<rect x="${x}" y="${y - 11}" width="46" height="22" rx="11" fill="${p > 0.5 ? C.teal : C.greyLight}"/>` +
    `<circle cx="${knob.toFixed(1)}" cy="${y}" r="8" fill="${C.white}"/>`;
}

// Soft tints of brand colors for badges (no new colors: brand color at low opacity over white).
export const TINT = { teal: 'rgba(13,148,136,0.12)', amber: 'rgba(245,158,11,0.2)' };

// Chat bubble with lines of text; side 'in' (left, white) or 'out' (right, mint). Returns { svg, h }.
export function bubble(lines, y, { side = 'in', time = '' } = {}) {
  const tw = Math.max(...lines.map((l) => layout(l, { family: 'roboto', weight: 400, size: 16 }).width)), w = tw + 30, h = lines.length * 22 + 26;
  const x = side === 'in' ? 14 : 376 - w, fill = side === 'in' ? C.white : C.mint;
  const svg = `<rect x="${x.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="${h}" rx="16" fill="${fill}"/>` +
    lines.map((l, i) => ui(l, x + 14, y + 26 + i * 22, { size: 16 })).join('') +
    ui(time, x + w - 12, y + h - 6, { size: 10, fill: C.muted, anchor: 'end' });
  return { svg, h };
}
