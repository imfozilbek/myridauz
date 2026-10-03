// Static brand assets: logo, lockups, plate device, Telegram, web.
import { text, markR, textCentered } from './text.mjs';
import { C, COMBOS, svg } from './palette.mjs';

export const squircle = (x, y, s, fill, extra = '') => `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${s * 0.22}" fill="${fill}"${extra}/>`;

export function icon(combo = 1, shape = 'squircle', S = 1024) {
  const { bg, fg } = COMBOS[combo];
  const edge = bg === C.white ? ` stroke="${C.edge}" stroke-width="${S * 0.004}"` : '';
  const shapes = {
    square: `<rect width="${S}" height="${S}" fill="${bg}"/>`,
    squircle: squircle(0, 0, S, bg, edge),
    circle: `<circle cx="${S / 2}" cy="${S / 2}" r="${S / 2}" fill="${bg}"${edge}/>`
  };
  return svg(S, S, shapes[shape] + markR({ cx: S / 2, cy: S / 2, h: S * 0.62, fill: fg }));
}

export const mark = (fill) => svg(620, 700, markR({ cx: 310, cy: 350, h: 700, fill }));
export const wordmark = (fill) => svg(1480, 520, text('Rida', { x: 740, y: 470, anchor: 'middle', fill, size: 600 }));

export function lockupH() {
  const body = squircle(40, 40, 440, C.teal) + markR({ cx: 260, cy: 260, h: 273, fill: C.white }) +
    text('Rida', { x: 560, y: 300, fill: C.teal, size: 330 }) +
    `<rect x="566" y="378" width="150" height="16" rx="8" fill="${C.amber}"/>` +
    text('Manzil sari', { x: 744, y: 420, fill: C.ink, weight: 600, size: 96 });
  return svg(1640, 520, body);
}

export function lockupV() {
  const body = squircle(300, 40, 400, C.teal) + markR({ cx: 500, cy: 240, h: 248, fill: C.white }) +
    text('Rida', { x: 500, y: 760, anchor: 'middle', fill: C.teal, size: 300 }) +
    `<rect x="425" y="810" width="150" height="16" rx="8" fill="${C.amber}"/>` +
    text('Manzil sari', { x: 500, y: 920, anchor: 'middle', fill: C.ink, weight: 600, size: 72 });
  return svg(1000, 980, body);
}

// Region plate device "code | R" (docs/36). Base design: 568 x 220.
export function plateGeom({ x = 0, y = 0, w = 568 } = {}) {
  const k = w / 568, h = 220 * k, sep = x + 344 * k;
  return { k, h, sep, codeCx: (x + 11 * k + sep) / 2, cy: y + h / 2, codeH: 140 * k, codeMaxW: sep - x - 60 * k, clip: { x: x + 20 * k, y: y + 20 * k, w: sep - x - 30 * k, h: h - 40 * k } };
}

export function plate(code, { x = 0, y = 0, w = 568, codeColor = C.ink } = {}) {
  const { k, h, sep } = plateGeom({ x, y, w });
  const tile = 150 * k, tx = (sep + x + w - 11 * k) / 2 - tile / 2, ty = y + h / 2 - tile / 2;
  return `<g id="plate"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${28 * k}" fill="${C.white}"/>` +
    `<rect x="${x + 11 * k}" y="${y + 11 * k}" width="${w - 22 * k}" height="${h - 22 * k}" rx="${18 * k}" fill="none" stroke="${C.ink}" stroke-width="${9 * k}"/>` +
    `<g id="code">${textCentered(code, { cx: (x + 11 * k + sep) / 2, cy: y + h / 2, h: 140 * k, fill: codeColor, maxWidth: sep - x - 60 * k })}</g>` +
    `<rect id="separator" x="${sep - 4.5 * k}" y="${y + 24 * k}" width="${9 * k}" height="${h - 48 * k}" fill="${C.ink}"/>` +
    `<g id="r-tile">${squircle(tx, ty, tile, C.teal)}${markR({ cx: tx + tile / 2, cy: ty + tile / 2, h: 94 * k, fill: C.white })}</g></g>`;
}

const ROLES = {
  passenger: { combo: 1, line: 'Oʻzbekiston boʻylab safarlar' },
  driver: { combo: 6, line: 'Safaringizga yoʻlovchi toping' },
  admin: { combo: 5, line: 'Rida Admin' },
  support: { combo: 2, line: 'Rida Yordam' }
};

export function botDescription(role) {
  const { bg, fg } = COMBOS[ROLES[role].combo];
  const body = `<rect width="640" height="360" fill="${bg}"/>` + markR({ cx: 320, cy: 118, h: 112, fill: fg }) +
    textCentered(ROLES[role].line, { cx: 320, cy: 238, h: 30, fill: fg, maxWidth: 560 }) +
    `<rect x="290" y="276" width="60" height="7" rx="3.5" fill="${fg}" opacity="0.8"/>` +
    textCentered('Manzil sari', { cx: 320, cy: 316, h: 20, fill: fg, weight: 600 });
  return svg(640, 360, body);
}

// BotFather splash: 512 viewBox, one <path>, no fill (Telegram fills it).
export const splash = () => `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">${markR({ cx: 256, cy: 256, h: 300, fill: null })}</svg>`;

export function ogImage() {
  const body = `<rect width="1200" height="630" fill="${C.teal}"/>` + squircle(96, 135, 360, C.white) +
    markR({ cx: 276, cy: 315, h: 223, fill: C.teal }) +
    text('Rida', { x: 520, y: 318, fill: C.white, size: 172 }) +
    text('Manzil sari', { x: 526, y: 398, fill: C.mint, weight: 600, size: 58 }) +
    `<rect x="526" y="438" width="130" height="12" rx="6" fill="${C.amber}"/>` +
    text('Viloyatlararo birga safarlar', { x: 526, y: 520, fill: C.white, weight: 600, size: 40, maxWidth: 600 }) +
    text('myrida.uz', { x: 1104, y: 584, anchor: 'end', fill: C.mint, weight: 500, size: 30 });
  return svg(1200, 630, body);
}
