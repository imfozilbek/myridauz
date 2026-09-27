// Text to outlined SVG paths with Rubik (no font needed where the SVG is shown).
import opentype from 'opentype.js';

const FONTS = {};
for (const w of [500, 600, 800]) FONTS[w] = opentype.loadSync(new URL(`../fonts/Rubik-${w}.ttf`, import.meta.url).pathname);
export const CAP = 0.7; // cap height / em for Rubik

// Rubik has no U+02BB / U+02BC: draw them with the look-alike quote glyphs.
const SUBST = { 'ʻ': '‘', 'ʼ': '’' };

export function layout(str, { weight = 800, size = 100, spacing = 0 } = {}) {
  const font = FONTS[weight];
  const scale = size / font.unitsPerEm;
  const chars = Array.from(str).map((c) => SUBST[c] || c);
  const glyphs = font.stringToGlyphs(chars.join(''));
  let x = 0;
  const parts = [];
  glyphs.forEach((g, i) => {
    parts.push({ g, x });
    let adv = g.advanceWidth * scale;
    if (i < glyphs.length - 1) adv += font.getKerningValue(g, glyphs[i + 1]) * scale + spacing * size;
    x += adv;
  });
  return { font, scale, parts, width: x, size };
}

// Returns an SVG <path>. anchor: start | middle | end. y is the baseline.
export function text(str, { x = 0, y = 0, anchor = 'start', fill = '#000', weight = 800, size = 100, spacing = 0, maxWidth, id } = {}) {
  let L = layout(str, { weight, size, spacing });
  if (maxWidth && L.width > maxWidth) L = layout(str, { weight, size: size * maxWidth / L.width, spacing });
  const x0 = anchor === 'middle' ? x - L.width / 2 : anchor === 'end' ? x - L.width : x;
  const d = L.parts.map((p) => p.g.getPath(x0 + p.x, y, L.size).toPathData(1)).join('');
  return `<path${id ? ` id="${id}"` : ''} d="${d}" fill="${fill}"/>`;
}

// Glyph "R" centered on (cx, cy) with the given cap height, as an SVG path.
export function markR({ cx, cy, h, fill = '#fff', id, decimals = 1 }) {
  const font = FONTS[800];
  const size = h / CAP;
  const g = font.charToGlyph('R');
  const bb = g.getPath(0, 0, size).getBoundingBox();
  const x = cx - (bb.x1 + bb.x2) / 2;
  const y = cy + h / 2;
  const d = g.getPath(x, y, size).toPathData(decimals);
  return fill === null ? `<path d="${d}"/>` : `<path${id ? ` id="${id}"` : ''} d="${d}" fill="${fill}"/>`;
}

// Text centered on (cx, cy) by cap height (for digits and caps).
export function textCentered(str, { cx, cy, h, fill, weight = 800, maxWidth, id, spacing = 0 }) {
  return text(str, { x: cx, y: cy + h / 2, anchor: 'middle', fill, weight, size: h / CAP, maxWidth, id, spacing });
}
