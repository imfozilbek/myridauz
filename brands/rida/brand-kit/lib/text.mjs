// Text to outlined SVG paths (no font needed where the SVG is shown).
import { C } from './palette.mjs';
// Families: rubik (brand) and roboto (Telegram on Android, for app screens).
import opentype from 'opentype.js';

const FAMILIES = { rubik: ['Rubik', [500, 600, 800]], roboto: ['Roboto', [400, 500, 700]] };
const FONTS = {};
for (const [key, [name, weights]] of Object.entries(FAMILIES)) {
  for (const w of weights) FONTS[`${key}-${w}`] = opentype.loadSync(new URL(`../fonts/${key}/${name}-${w}.ttf`, import.meta.url).pathname);
}
const CAP = 0.7; // cap height / em for Rubik

// No U+02BB in either font (Rubik also lacks U+02BC): draw look-alike quote glyphs.
const SUBST = { 'ʻ': '‘', 'ʼ': '’' };

// Neither font has "→": a drawn arrow in font units, bolder for heavy weights.
const ARROWS = {};
function arrow(key, font, weight) {
  if (ARROWS[key]) return ARROWS[key];
  const em = font.unitsPerEm, th = em * (weight >= 700 ? 0.09 : 0.065), y = em * 0.3, head = em * 0.2;
  const x0 = em * 0.1, x1 = em * 0.86, xh = x1 - head * 1.1;
  const path = new opentype.Path();
  [[x0, y + th / 2], [xh, y + th / 2], [xh, y + head], [x1, y], [xh, y - head], [xh, y - th / 2], [x0, y - th / 2]]
    .forEach(([px, py], i) => (i ? path.lineTo(px, py) : path.moveTo(px, py)));
  path.close();
  path.unitsPerEm = em;
  return (ARROWS[key] = new opentype.Glyph({ name: 'arrowright', unicode: 0x2192, advanceWidth: em * 0.96, path }));
}

export function layout(str, { family = 'rubik', weight = 800, size = 100, spacing = 0 } = {}) {
  const key = `${family}-${weight}`, font = FONTS[key];
  const scale = size / font.unitsPerEm;
  const glyphs = Array.from(str).map((c) => (c === '→' ? arrow(key, font, weight) : font.charToGlyph(SUBST[c] || c)));
  let x = 0;
  const parts = [];
  glyphs.forEach((g, i) => {
    parts.push({ g, x });
    let adv = g.advanceWidth * scale;
    const next = glyphs[i + 1];
    if (next) adv += (g.index >= 0 && next.index >= 0 ? font.getKerningValue(g, next) * scale : 0) + spacing * size;
    x += adv;
  });
  return { font, scale, parts, width: x, size };
}

// Returns an SVG <path>. anchor: start | middle | end. y is the baseline. Cached: frames repeat texts.
const cache = new Map();
export function text(str, opts = {}) {
  const key = str + JSON.stringify(opts);
  if (!cache.has(key)) cache.set(key, draw(str, opts));
  return cache.get(key);
}
function draw(str, { x = 0, y = 0, anchor = 'start', fill = C.black, family, weight = 800, size = 100, spacing = 0, maxWidth, id }) {
  let L = layout(str, { family, weight, size, spacing });
  if (maxWidth && L.width > maxWidth) L = layout(str, { family, weight, size: size * maxWidth / L.width, spacing });
  const x0 = anchor === 'middle' ? x - L.width / 2 : anchor === 'end' ? x - L.width : x;
  const d = L.parts.map((p) => p.g.getPath(x0 + p.x, y, L.size).toPathData(1)).join('');
  return `<path${id ? ` id="${id}"` : ''} d="${d}" fill="${fill}"/>`;
}

// Glyph "R" centered on (cx, cy) with the given cap height, as an SVG path.
export function markR({ cx, cy, h, fill = C.white, id, decimals = 1 }) {
  const font = FONTS['rubik-800'];
  const size = h / CAP;
  const g = font.charToGlyph('R');
  const bb = g.getPath(0, 0, size).getBoundingBox();
  const x = cx - (bb.x1 + bb.x2) / 2;
  const y = cy + h / 2;
  const path = g.getPath(x, y, size);
  const d = fill === null ? cubicPathData(path) : path.toPathData(decimals);
  return fill === null ? `<path d="${d}"/>` : `<path${id ? ` id="${id}"` : ''} d="${d}" fill="${fill}"/>`;
}

// BotFather reads only M, L, C, Z with integers: quadratic curves become cubic, zero-length lines are dropped.
function cubicPathData(path) {
  const r = Math.round, out = [];
  let px = 0, py = 0;
  for (const c of path.commands) {
    if (c.type === 'M') out.push(`M${r(c.x)} ${r(c.y)}`);
    else if (c.type === 'L' && (r(c.x) !== r(px) || r(c.y) !== r(py))) out.push(`L${r(c.x)} ${r(c.y)}`);
    else if (c.type === 'Q') out.push(`C${r(px + (2 / 3) * (c.x1 - px))} ${r(py + (2 / 3) * (c.y1 - py))} ${r(c.x + (2 / 3) * (c.x1 - c.x))} ${r(c.y + (2 / 3) * (c.y1 - c.y))} ${r(c.x)} ${r(c.y)}`);
    else if (c.type === 'C') out.push(`C${r(c.x1)} ${r(c.y1)} ${r(c.x2)} ${r(c.y2)} ${r(c.x)} ${r(c.y)}`);
    else if (c.type === 'Z') out.push('Z');
    if (c.type !== 'Z') [px, py] = [c.x, c.y];
  }
  return out.join('');
}

// Outline of one Rubik ExtraBold glyph at a font size, baseline at y = 0 (opentype.js Path).
export const glyphPath = (char, size) => FONTS['rubik-800'].charToGlyph(char).getPath(0, 0, size);

// Text centered on (cx, cy) by cap height (for digits and caps).
export function textCentered(str, { cx, cy, h, fill, weight = 800, maxWidth, id, spacing = 0 }) {
  return text(str, { x: cx, y: cy + h / 2, anchor: 'middle', fill, weight, size: h / CAP, maxWidth, id, spacing });
}
