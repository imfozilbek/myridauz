// Two-sided flyer 99 x 210 mm for one direction (owner, 18.10.2026): the passenger side and the driver side,
// each with three steps on the screens of its Mini App. 300 dpi with 3 mm of bleed: 105 x 216 mm.
// Texts are the approved ones of the landing (docs/60), the QR poster and the story of drivers (docs/38).
import fs from 'node:fs';
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
// steps: the caption in two lines and where the window on the screen starts (the screen is 780 x 1560).
const COPY = {
  passenger: {
    role: 'Yoʻlovchi', title: 'Safar toping', sub: 'Viloyatlararo birga safarlar',
    steps: [[['Yoʻnalishni', 'tanlang'], 0], [['Safarni', 'tanlang'], 0], [['Joy band', 'qiling'], 200]],
    facts: [['ShieldCheck', ['Tekshirilgan', 'haydovchilar']], ['EyeOff', ['Raqamingiz', 'yashirin']], ['Venus', ['Mashinada', 'ayol bor']], ['Send', ['Telegram', 'ichida']]],
  },
  driver: {
    role: 'Haydovchi', title: 'Haydovchimisiz?', sub: 'Safaringizga yoʻlovchi toping',
    steps: [[['Safaringizni', 'eʼlon qiling'], 0], [['Yoʻlovchilar', 'sizni topadi'], 0], [['Tasdiqlang,', 'joylar toʻladi'], 0]],
    facts: [['Banknote', ['Narxni oʻzingiz', 'belgilaysiz']], ['Clock', ['Pitakda kutish', 'shart emas']], ['MessageSquareOff', ['Har 10 daqiqada', 'yozish shart emas']],
      ['Gift', ['Yangi haydovchilarga', `${sum(PROMO.amount * PROMO.grants)}gacha bonus`], true]],
  },
};

function band(s, copy) {
  const pill = layout(copy.role, { weight: 600, size: 40 }).width + 64;
  return `<rect width="${W}" height="600" fill="${s.band}"/>` + squircle(M, 100, 150, s.logo.bg) + markR({ cx: M + 75, cy: 175, h: 93, fill: s.logo.fg }) +
    text(NAME, { x: M + 186, y: 202, fill: C.white, size: 110 }) + text('Manzil sari', { x: M + 190, y: 254, fill: s.light, weight: 600, size: 42 }) +
    `<rect x="${W - M - pill}" y="136" width="${pill}" height="78" rx="39" fill="${C.white}"/>` +
    text(copy.role, { x: W - M - pill / 2, y: 189, anchor: 'middle', fill: s.band, weight: 600, size: 40 }) +
    text(copy.title, { x: M, y: 422, fill: C.white, size: 140, maxWidth: CW }) +
    text(copy.sub, { x: M, y: 502, fill: s.light, weight: 600, size: 50, maxWidth: CW });
}

// The line of a route of the brand (docs/38): teal start, dashes, amber finish; both ways.
function route(from, to) {
  const y = 650, size = 56, toW = layout(to, { size }).width, a = M + 56, b = W - M - 56 - toW - 44;
  const start = a + 40 + layout(from, { size }).width + 34, end = b - 34, n = Math.max(1, Math.floor((end - start) / 34));
  const dashes = Array.from({ length: n }, (_, i) => `<rect x="${start + i * 34}" y="${y - 6}" width="22" height="12" rx="6" fill="${C.teal}"/>`).join('');
  return `<rect x="${M}" y="560" width="${CW}" height="200" rx="40" fill="${C.white}" stroke="${C.divider}" stroke-width="6"/>` +
    `<circle cx="${a}" cy="${y}" r="24" fill="${C.teal}"/>` + text(from, { x: a + 40, y: y + 20, fill: C.ink, size }) + dashes +
    `<circle cx="${b}" cy="${y}" r="24" fill="${C.amber}"/>` + text(to, { x: b + 40, y: y + 20, fill: C.ink, size }) +
    text('va orqaga', { x: W / 2, y: y + 76, anchor: 'middle', fill: C.muted, weight: 600, size: 36 });
}

// Three screens of the Mini App of a side (e2e/stand/flyer-shots.spec.ts), each in a phone, the step under it.
const SHOT = { width: 780, window: 1360 }, PHONE = { width: 316, bezel: 8, y: 810 };
function steps(s, side, flyer) {
  const inner = PHONE.width - 2 * PHONE.bezel, ih = Math.round(SHOT.window * inner / SHOT.width), h = ih + 2 * PHONE.bezel;
  const gap = (CW - 3 * PHONE.width) / 2, y = PHONE.y;
  return COPY[side].steps.map(([lines, top], i) => {
    const x = M + i * (PHONE.width + gap), cx = x + PHONE.width / 2, id = `${side}-${i + 1}`;
    const jpg = fs.readFileSync(new URL(`../data/flyer-screens/${flyer.id}/${id}.jpg`, import.meta.url)).toString('base64');
    return `<clipPath id="clip-${id}"><rect x="${x + PHONE.bezel}" y="${y + PHONE.bezel}" width="${inner}" height="${ih}" rx="26"/></clipPath>` +
      `<rect x="${x}" y="${y}" width="${PHONE.width}" height="${h}" rx="34" fill="${C.ink}"/>` +
      `<g clip-path="url(#clip-${id})"><svg x="${x + PHONE.bezel}" y="${y + PHONE.bezel}" width="${inner}" height="${ih}" viewBox="0 ${top} ${SHOT.width} ${SHOT.window}">` +
      `<image href="data:image/jpeg;base64,${jpg}" width="${SHOT.width}" height="1560"/></svg></g>` +
      `<circle cx="${cx}" cy="${y + h + 56}" r="36" fill="${s.band}"/>` +
      text(String(i + 1), { x: cx, y: y + h + 76, anchor: 'middle', fill: C.white, size: 56 }) +
      lines.map((line, n) => text(line, { x: cx, y: y + h + 146 + n * 46, anchor: 'middle', fill: C.ink, weight: 600, size: 40, maxWidth: PHONE.width })).join('');
  }).join('');
}

// The facts of a side in a grid of two; a box of the other color stands out (the bonus of a driver).
function facts(s, list) {
  const w = (CW - 20) / 2, h = 110;
  return list.map(([name, [first, second], box], i) => {
    const x = M + (i % 2) * (w + 20), y = 1590 + Math.floor(i / 2) * (h + 20), ink = box ? s.boxInk : C.ink;
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="28" fill="${box ? s.box : s.soft}"/>` +
      `<circle cx="${x + 52}" cy="${y + h / 2}" r="32" fill="${box ? s.box : C.white}"/>` + icon(name, x + 52, y + h / 2, 40, box ? s.boxInk : s.band, 2.25) +
      text(first, { x: x + 100, y: y + 48, fill: ink, weight: 600, size: box ? 30 : 36, maxWidth: w - 116 }) +
      text(second, { x: x + 100, y: y + 92, fill: ink, weight: box ? 800 : 600, size: 36, maxWidth: w - 116 });
  }).join('');
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

// One side of the flyer of a direction: `side` is passenger or driver, `flyer` an entry of data/flyers.json.
export function flyerSide(side, flyer) {
  const s = SIDES[side], copy = COPY[side], y = 1880, size = 460, x = M + size + 44;
  const lines = (list, top, opts) => list.map((line, n) => text(line, { x, y: top + n * opts.gap, maxWidth: W - M - x, ...opts })).join('');
  return svg(W, H, `<rect width="${W}" height="${H}" fill="${C.white}"/>` + band(s, copy) + route(flyer.from, flyer.to) +
    steps(s, side, flyer) + facts(s, copy.facts) + qr(flyer[side], M, y, size, s) +
    lines(['Telefon kamerasi', 'bilan skanerlang'], y + 64, { fill: C.ink, weight: 600, size: 44, gap: 56 }) +
    `<rect x="${x}" y="${y + 200}" width="120" height="14" rx="7" fill="${C.amber}"/>` +
    text(SITE, { x, y: y + 290, fill: s.band, size: 62, maxWidth: W - M - x }) +
    lines(['Telegramda ochiladi.', 'Ilova yuklab olish shart emas.'], y + 360, { fill: C.muted, weight: 600, size: 32, gap: 42 }));
}
