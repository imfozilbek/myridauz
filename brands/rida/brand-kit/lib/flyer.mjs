// Two-sided flyer 99 x 210 mm for one direction (owner, 18.10.2026): the passenger side and the driver side.
// 300 dpi with 3 mm of bleed on every edge: 105 x 216 mm. Texts are the approved ones of the landing (docs/60).
import { encode } from 'uqr';
import { text, markR, layout } from './text.mjs';
import { C, COMBOS, svg } from './palette.mjs';
import { squircle } from './brand.mjs';
import { icon } from '../promo/icons.mjs';
import { NAME, SITE, PROMO } from './production.mjs';
import { theme } from '../../theme.ts';

const DPI = 300, MM = DPI / 25.4;
export const FLYER_MM = { width: 105, height: 216 };
const W = Math.round(FLYER_MM.width * MM), H = Math.round(FLYER_MM.height * MM);
const M = Math.round(9 * MM), CW = W - 2 * M; // 3 mm of bleed and 6 mm of safe field
const driverApp = theme.apps.driver;
// Each side wears the color of its Mini App (docs/20): teal for the passenger, amber for the driver.
// The logo on the band and in the QR: combos of the table only (docs/36, lesson №313).
const SIDES = {
  passenger: { band: C.teal, soft: C.soft, light: C.mint, box: C.amber, boxInk: C.ink, logo: COMBOS[2], center: COMBOS[1] },
  driver: { band: driverApp.brandStrong, soft: driverApp.brandSoft, light: driverApp.brandMint, box: C.teal, boxInk: C.white, logo: COMBOS[4], center: COMBOS[3] },
};
const sum = (n) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} soʻm`;
const COPY = {
  passenger: {
    role: 'Yoʻlovchi', title: 'Safar toping', sub: 'Viloyatlararo birga safarlar',
    facts: [['ShieldCheck', 'Tekshirilgan haydovchilar'], ['EyeOff', 'Raqamingiz yashirin'], ['Venus', 'Mashinada ayol bor'], ['Send', 'Telegram ichida']],
    steps: [['Skanerlang'], ['Safarni tanlang'], ['Joy band qiling']],
  },
  driver: {
    role: 'Haydovchi', title: 'Haydovchimisiz?', sub: 'Safaringizga yoʻlovchi toping',
    facts: [['Banknote', 'Yoʻl xarajatini birga koʻtaring'], ['Clock', 'Pitakda kutish shart emas'], ['Repeat', 'Qaytishda ham yoʻlovchi']],
    box: ['Gift', `${sum(PROMO.amount * PROMO.grants)}gacha bonus`, 'Yangi haydovchilarga'],
    steps: [['Safaringizni', 'eʼlon qiling'], ['Yoʻlovchilar', 'sizni topadi'], ['Tasdiqlang,', 'joylar toʻladi']],
  },
};

function band(s, copy) {
  const pill = layout(copy.role, { weight: 600, size: 40 }).width + 64;
  return `<rect width="${W}" height="700" fill="${s.band}"/>` + squircle(M, 112, 150, s.logo.bg) + markR({ cx: M + 75, cy: 187, h: 93, fill: s.logo.fg }) +
    text(NAME, { x: M + 186, y: 214, fill: C.white, size: 110 }) + text('Manzil sari', { x: M + 190, y: 266, fill: s.light, weight: 600, size: 42 }) +
    `<rect x="${W - M - pill}" y="148" width="${pill}" height="78" rx="39" fill="${C.white}"/>` +
    text(copy.role, { x: W - M - pill / 2, y: 201, anchor: 'middle', fill: s.band, weight: 600, size: 40 }) +
    text(copy.title, { x: M, y: 470, fill: C.white, size: 150, maxWidth: CW }) +
    text(copy.sub, { x: M, y: 556, fill: s.light, weight: 600, size: 52, maxWidth: CW });
}

// The line of a route of the brand (docs/38): teal start, dashes, amber finish; both ways.
function route(from, to) {
  const x = M + 84, dashes = Array.from({ length: 4 }, (_, i) => `<rect x="${x - 6}" y="${800 + i * 34}" width="12" height="22" rx="6" fill="${C.teal}"/>`).join('');
  return `<rect x="${M}" y="628" width="${CW}" height="412" rx="40" fill="${C.white}" stroke="${C.divider}" stroke-width="6"/>` +
    `<circle cx="${x}" cy="740" r="28" fill="${C.teal}"/>` + text(from, { x: M + 156, y: 770, fill: C.ink, size: 84, maxWidth: CW - 190 }) + dashes +
    text('va orqaga', { x: M + 158, y: 872, fill: C.muted, weight: 600, size: 44 }) +
    `<circle cx="${x}" cy="964" r="28" fill="${C.amber}"/>` + text(to, { x: M + 156, y: 994, fill: C.ink, size: 84, maxWidth: CW - 190 });
}

const fact = (s, [name, label], y) => `<circle cx="${M + 46}" cy="${y}" r="46" fill="${s.soft}"/>` + icon(name, M + 46, y, 50, s.band, 2.25) +
  text(label, { x: M + 124, y: y + 19, fill: C.ink, weight: 600, size: 52, maxWidth: CW - 124 });

function bonus(s, [name, label, lead], y) {
  return `<rect x="${M}" y="${y - 70}" width="${CW}" height="140" rx="32" fill="${s.box}"/>` + icon(name, M + 70, y, 60, s.boxInk, 2.25) +
    text(lead, { x: M + 136, y: y - 14, fill: s.boxInk, weight: 600, size: 38, maxWidth: CW - 170 }) +
    text(label, { x: M + 136, y: y + 44, fill: s.boxInk, size: 52, maxWidth: CW - 170 });
}

// The QR with the R tile in the middle: level H keeps it readable under the tile (docs/38).
// One rectangle per run of dark modules, a hair taller than a row: no white seams in print.
function qr(url, x, y, size, s) {
  const { data } = encode(url, { ecc: 'H', border: 0 }), cell = size / data.length, k = size * 0.12;
  let d = '';
  data.forEach((row, r) => row.forEach((on, c) => {
    if (!on || row[c - 1]) return;
    let end = c;
    while (row[end + 1]) end += 1;
    d += `M${(x + c * cell).toFixed(2)} ${(y + r * cell).toFixed(2)}h${((end - c + 1) * cell).toFixed(2)}v${(cell + 0.6).toFixed(2)}H${(x + c * cell).toFixed(2)}z`;
  }));
  const cx = x + size / 2, cy = y + size / 2;
  return `<path d="${d}" fill="${C.ink}" shape-rendering="crispEdges"/>` + squircle(cx - k - 14, cy - k - 14, 2 * k + 28, C.white) + squircle(cx - k, cy - k, 2 * k, s.center.bg) +
    markR({ cx, cy, h: k * 1.24, fill: s.center.fg });
}

function steps(s, list, x, top, bottom) {
  const gap = (bottom - top) / list.length;
  return list.map((lines, i) => {
    const cy = top + gap * (i + 0.5), first = cy + 17 - (lines.length - 1) * 30;
    return `<circle cx="${x + 38}" cy="${cy}" r="38" fill="${s.band}"/>` + text(String(i + 1), { x: x + 38, y: cy + 21, anchor: 'middle', fill: C.white, size: 58 }) +
      lines.map((line, n) => text(line, { x: x + 100, y: first + n * 60, fill: C.ink, weight: 600, size: 46, maxWidth: W - M - x - 100 })).join('');
  }).join('');
}

// One side of the flyer of a direction: `side` is passenger or driver, `flyer` an entry of data/flyers.json.
export function flyerSide(side, flyer) {
  const s = SIDES[side], copy = COPY[side], top = 1110, step = 118;
  const facts = copy.facts.map((f, i) => fact(s, f, top + i * step)).join('');
  const box = copy.box ? bonus(s, copy.box, top + copy.facts.length * step + 30) : '';
  const qrY = 1700, qrSize = 480;
  return svg(W, H, `<rect width="${W}" height="${H}" fill="${C.white}"/>` + band(s, copy) + route(flyer.from, flyer.to) + facts + box +
    text('Telefon kamerasi bilan skanerlang', { x: M, y: 1640, fill: C.muted, weight: 600, size: 44, maxWidth: CW }) +
    qr(flyer[side], M, qrY, qrSize, s) + steps(s, copy.steps, M + qrSize + 48, qrY, qrY + qrSize) +
    `<rect x="${M}" y="2290" width="120" height="14" rx="7" fill="${C.amber}"/>` +
    text(SITE, { x: M + 150, y: 2320, fill: s.band, size: 64 }) +
    text('Telegramda ochiladi. Ilova yuklab olish shart emas.', { x: M, y: 2410, fill: C.muted, weight: 600, size: 36, maxWidth: CW }));
}
