// Brand colors from data/tokens.json (the color table of docs/20).
import fs from 'node:fs';

export const TOKENS = JSON.parse(fs.readFileSync(new URL('../data/tokens.json', import.meta.url), 'utf8'));
const color = (name) => TOKENS.colors.find((c) => c.name === name).value;
export const C = {
  teal: color('color.brand.strong'), deep: color('color.brand.deep'), mint: color('color.brand.mint'),
  amber: color('color.accent'), amberStrong: color('color.accent.strong'),
  white: '#FFFFFF', ink: color('color.text'), muted: color('color.text.muted')
};
// Six logo combos (docs/36): background and R color.
export const COMBOS = {
  1: { bg: C.teal, fg: C.white }, 2: { bg: C.white, fg: C.teal }, 3: { bg: C.amberStrong, fg: C.white },
  4: { bg: C.white, fg: C.amberStrong }, 5: { bg: C.deep, fg: C.amber }, 6: { bg: C.amber, fg: C.deep }
};
export const svg = (w, h, body, extra = '') => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"${extra}>${body}</svg>`;
