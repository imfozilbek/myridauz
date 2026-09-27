// Social templates (1080 x 1080, 1080 x 1920) and print (car sticker, QR poster).
import { text, markR, textCentered, layout } from './text.mjs';
import { C, svg } from './palette.mjs';
import { squircle, plate } from './brand.mjs';

const tile = (x, y, s, bg = C.teal, fg = C.white) => squircle(x, y, s, bg) + markR({ cx: x + s / 2, cy: y + s / 2, h: s * 0.62, fill: fg });
const bar = (cx, y, w = 150, h = 14) => `<rect x="${cx - w / 2}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${C.amber}"/>`;

export function postSoon() {
  return svg(1080, 1080, `<rect width="1080" height="1080" fill="${C.teal}"/>` + tile(390, 110, 300, C.white, C.teal) +
    textCentered('Tez orada', { cx: 540, cy: 560, h: 110, fill: C.white }) +
    textCentered('Viloyatlararo birga safarlar', { cx: 540, cy: 668, h: 42, fill: C.mint, weight: 600, maxWidth: 900 }) +
    bar(540, 736) + textCentered('Manzil sari', { cx: 540, cy: 826, h: 40, fill: C.white, weight: 600 }) +
    textCentered('myrida.uz', { cx: 540, cy: 990, h: 26, fill: C.mint, weight: 500 }));
}

export function postLaunch() {
  const plates = ['30', '80', '95'].map((c, i) => plate(c, { x: 80 + i * 320, y: 700, w: 280 })).join('');
  return svg(1080, 1080, `<rect width="1080" height="1080" fill="${C.white}"/>` + tile(80, 80, 120) +
    text('Rida', { x: 228, y: 164, fill: C.teal, size: 92 }) +
    text('Rida ishga tushdi', { x: 80, y: 420, fill: C.ink, size: 128, maxWidth: 920 }) +
    text('Safar toping yoki', { x: 80, y: 510, fill: C.muted, weight: 600, size: 54 }) +
    text('safaringizga yoʻlovchi oling', { x: 80, y: 580, fill: C.muted, weight: 600, size: 54, maxWidth: 920 }) +
    `<rect x="72" y="690" width="936" height="128" rx="20" fill="${C.teal}"/>` + plates +
    `<rect x="80" y="930" width="140" height="14" rx="7" fill="${C.amber}"/>` +
    text('Manzil sari', { x: 250, y: 950, fill: C.teal, weight: 600, size: 50 }));
}

export function postWoman() {
  const label = 'Mashinada ayol bor';
  const w = layout(label, { weight: 800, size: 60 }).width + 110;
  return svg(1080, 1080, `<rect width="1080" height="1080" fill="${C.white}"/>` +
    `<rect x="${540 - w / 2}" y="220" width="${w}" height="120" rx="60" fill="${C.amber}"/>` +
    textCentered(label, { cx: 540, cy: 280, h: 42, fill: C.ink }) +
    textCentered('Ayollar uchun', { cx: 540, cy: 500, h: 90, fill: C.ink }) +
    textCentered('xotirjam safar', { cx: 540, cy: 620, h: 90, fill: C.teal }) +
    textCentered('Shu belgili safarlarni tanlang', { cx: 540, cy: 740, h: 40, fill: C.muted, weight: 600, maxWidth: 900 }) +
    tile(80, 880, 120) + text('Rida', { x: 228, y: 964, fill: C.teal, size: 92 }) +
    text('Manzil sari', { x: 1000, y: 958, anchor: 'end', fill: C.muted, weight: 600, size: 46 }));
}

export function storyDriver() {
  return svg(1080, 1920, `<rect width="1080" height="1920" fill="${C.deep}"/>` + tile(440, 200, 200, C.white, C.teal) +
    textCentered('Haydovchimisiz?', { cx: 540, cy: 660, h: 104, fill: C.white, maxWidth: 960 }) +
    textCentered('Safaringizga yoʻlovchi toping', { cx: 540, cy: 800, h: 48, fill: C.mint, weight: 600, maxWidth: 960 }) +
    textCentered('Yoʻl xarajatini birga koʻtaring', { cx: 540, cy: 880, h: 48, fill: C.mint, weight: 600, maxWidth: 960 }) +
    `<rect x="90" y="1040" width="900" height="330" rx="48" fill="${C.amber}"/>` +
    textCentered('Yangi haydovchilarga', { cx: 540, cy: 1150, h: 50, fill: C.ink }) +
    textCentered('1 500 000 soʻmgacha bonus', { cx: 540, cy: 1260, h: 62, fill: C.ink, maxWidth: 820 }) +
    bar(540, 1640) + textCentered('Manzil sari', { cx: 540, cy: 1740, h: 46, fill: C.white, weight: 600 }));
}

// Route story. t = animation time in seconds; default shows the final state.
const clamp = (v) => Math.max(0, Math.min(1, v));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const outCubic = (p) => 1 - Math.pow(1 - p, 3);
const pop = (p) => (p <= 0 ? 0 : 1 + 2.7 * Math.pow(p - 1, 3) + 1.7 * Math.pow(p - 1, 2));
const scaleAt = (cx, cy, s) => `translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`;

export function storyRoute(t = 99) {
  const card = outCubic(prog(t, 0, 0.45)), a = pop(prog(t, 0.35, 0.7)), line = outCubic(prog(t, 0.7, 1.8));
  const b = pop(prog(t, 1.8, 2.15)), det = (k) => outCubic(prog(t, 2.2 + k * 0.15, 2.6 + k * 0.15)), btn = pop(prog(t, 2.8, 3.2));
  const dash = Array.from({ length: 7 }, (_, i) => `<rect x="194" y="${580 + i * 38}" width="12" height="22" rx="6" fill="${C.teal}"/>`).join('');
  const markerY = 560 + 300 * line;
  return svg(1080, 1920, `<defs><clipPath id="reveal"><rect x="150" y="560" width="100" height="${300 * line}"/></clipPath></defs>` +
    `<rect width="1080" height="1920" fill="${C.teal}"/>` +
    textCentered('Yangi safar', { cx: 540, cy: 250, h: 80, fill: C.white }) +
    `<g id="card" opacity="${card}" transform="translate(0 ${80 * (1 - card)})"><rect x="90" y="380" width="900" height="1120" rx="56" fill="${C.white}"/>` +
    `<g id="from" transform="${scaleAt(200, 520, a)}"><circle cx="200" cy="520" r="26" fill="${C.teal}"/></g>` +
    `<g opacity="${a > 0 ? 1 : 0}">${text('Toshkent', { x: 262, y: 545, fill: C.ink, size: 72 })}</g>` +
    `<g id="line" clip-path="url(#reveal)">${dash}</g>` +
    (line > 0 && line < 1 ? `<circle cx="200" cy="${markerY}" r="18" fill="${C.amber}" stroke="${C.white}" stroke-width="6"/>` : '') +
    `<g id="to" transform="${scaleAt(200, 880, b)}"><circle cx="200" cy="880" r="26" fill="${C.amber}"/></g>` +
    `<g opacity="${b > 0 ? 1 : 0}">${text('Samarqand', { x: 262, y: 905, fill: C.ink, size: 72 })}</g>` +
    `<g id="details"><rect x="150" y="990" width="780" height="3" fill="#E5EEEC" opacity="${det(0)}"/>` +
    `<g opacity="${det(0)}">${text('Ertaga · 08:00', { x: 150, y: 1095, fill: C.muted, weight: 600, size: 58 })}</g>` +
    `<g opacity="${det(1)}">${text('3 ta joy', { x: 150, y: 1185, fill: C.muted, weight: 600, size: 58 })}</g>` +
    `<g opacity="${det(2)}">${text('115 000 soʻm', { x: 930, y: 1185, anchor: 'end', fill: C.teal, size: 76 })}</g></g>` +
    `<g id="button" transform="${scaleAt(540, 1355, btn)}"><rect x="150" y="1290" width="780" height="130" rx="30" fill="${C.teal}"/>` +
    textCentered('Band qilish', { cx: 540, cy: 1355, h: 46, fill: C.white }) + `</g></g>` +
    tile(480, 1600, 120, C.white, C.teal) + textCentered('Manzil sari', { cx: 540, cy: 1810, h: 40, fill: C.white, weight: 600 }));
}

export function carSticker() {
  const S = 2362;
  return svg(S, S, `<circle cx="${S / 2}" cy="${S / 2}" r="${S / 2}" fill="${C.teal}"/>` +
    markR({ cx: S / 2, cy: S * 0.4, h: S * 0.4, fill: C.white }) +
    textCentered('Rida', { cx: S / 2, cy: S * 0.73, h: S * 0.12, fill: C.white }) +
    textCentered('myrida.uz', { cx: S / 2, cy: S * 0.86, h: S * 0.045, fill: C.mint, weight: 600 }));
}

export function qrPoster(matrix) {
  const W = 2480, n = matrix.length, size = 1300, cell = size / n, x0 = (W - size) / 2, y0 = 1300;
  let d = '';
  matrix.forEach((row, r) => row.forEach((on, c) => { if (on) d += `M${(x0 + c * cell).toFixed(1)} ${(y0 + r * cell).toFixed(1)}h${cell.toFixed(2)}v${cell.toFixed(2)}h-${cell.toFixed(2)}z`; }));
  const steps = ['Skanerlang', 'Safarni tanlang', 'Joy band qiling'].map((t, i) => {
    const cx = 480 + i * 760;
    return `<circle cx="${cx}" cy="2860" r="90" fill="${C.teal}"/>` + textCentered(String(i + 1), { cx, cy: 2860, h: 80, fill: C.white }) +
      textCentered(t, { cx, cy: 3060, h: 52, fill: C.ink, weight: 600, maxWidth: 680 });
  }).join('');
  return svg(W, 3508, `<rect width="${W}" height="3508" fill="${C.white}"/><rect width="${W}" height="720" fill="${C.teal}"/>` +
    tile(160, 180, 360, C.white, C.teal) + text('Rida', { x: 600, y: 450, fill: C.white, size: 250 }) +
    text('Manzil sari', { x: 606, y: 560, fill: C.mint, weight: 600, size: 86 }) +
    text('Safar toping', { x: 160, y: 1030, fill: C.ink, size: 250 }) +
    text('Telefon kamerasi bilan skanerlang', { x: 160, y: 1170, fill: C.muted, weight: 600, size: 90, maxWidth: 2160 }) +
    `<path d="${d}" fill="${C.ink}"/>` + squircle(W / 2 - 170, y0 + size / 2 - 170, 340, C.white) + tile(W / 2 - 140, y0 + size / 2 - 140, 280) +
    steps + textCentered('myrida.uz', { cx: W / 2, cy: 3340, h: 80, fill: C.teal }));
}
