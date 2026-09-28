// Brand colors come only from brands/rida/theme.ts (docs/20, docs/22).
// data/tokens.json keeps what each color is for, and the motion tokens.
import fs from 'node:fs';
import { theme } from '../../theme.ts';

const { colors, art } = theme;
const notes = JSON.parse(fs.readFileSync(new URL('../data/tokens.json', import.meta.url), 'utf8'));
const tokenName = (key) => `color.${key.replace(/[A-Z]/g, (letter) => `.${letter.toLowerCase()}`)}`;
export const TOKENS = {
  name: notes.name, theme: notes.theme, motion: notes.motion,
  colors: Object.entries(notes.colorUsage).map(([key, usage]) => ({ name: tokenName(key), value: colors[key], usage }))
};
export const C = {
  teal: colors.brandStrong, deep: colors.brandDeep, mint: colors.brandMint, amber: colors.accent,
  amberStrong: colors.accentStrong, white: colors.bg, ink: colors.text, muted: colors.textMuted,
  soft: colors.brandSoft, tealText: colors.brandText, telegramBg: colors.bgGrouped, ...art
};
// Six logo combos (docs/36): background and R color.
export const COMBOS = {
  1: { bg: C.teal, fg: C.white }, 2: { bg: C.white, fg: C.teal }, 3: { bg: C.amberStrong, fg: C.white },
  4: { bg: C.white, fg: C.amberStrong }, 5: { bg: C.deep, fg: C.amber }, 6: { bg: C.amber, fg: C.deep }
};
export const svg = (w, h, body, extra = '') => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"${extra}>${body}</svg>`;
