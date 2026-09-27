// Lucide icons (ISC license, lucide-static) as SVG groups.
import * as lucide from 'lucide-static';

const inner = {};
// Icon centered at (cx, cy), `size` px wide, stroke color and width in icon units (24 grid).
export function icon(name, cx, cy, size, color, width = 2) {
  inner[name] ??= lucide[name].replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const s = size / 24;
  return `<g transform="translate(${+(cx - size / 2).toFixed(2)} ${+(cy - size / 2).toFixed(2)}) scale(${+s.toFixed(4)})" fill="none" stroke="${color}" ` +
    `stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round">${inner[name]}</g>`;
}
// Curried form for helpers that place the icon themselves (pill, badge).
export const iconOf = (name, width) => (cx, cy, size, color) => icon(name, cx, cy, size, color, width);
