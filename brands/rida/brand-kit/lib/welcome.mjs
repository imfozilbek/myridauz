// The picture of the first message of the driver bot (G34, docs/95): what Rida gives a driver,
// four signs on the brand amber. The bonus comes from the brand config, never typed here.
import { icon } from '../promo/icons.mjs';
import { squircle } from './brand.mjs';
import { C, svg } from './palette.mjs';
import { markR, textCentered } from './text.mjs';
import { brandConfig } from '../../brand.config.ts';

const money = (amount) => `${String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} soʻm`;
const POINTS = [
  ['CarFront', 'Safar bir daqiqada'],
  ['Users', 'Yoʻlovchi sizni topadi'],
  ['Banknote', 'Yoʻl xarajati qaytadi'],
  ['Gift', `${money(brandConfig.promo.amount)} bonus`],
];

function point([name, line], index) {
  const x = 80 + (index % 2) * 570, y = 300 + Math.floor(index / 2) * 190;
  return `<rect x="${x}" y="${y}" width="550" height="160" rx="36" fill="${C.white}"/>` +
    squircle(x + 28, y + 28, 104, C.deep) + icon(name, x + 80, y + 80, 60, C.amber, 2.2) +
    textCentered(line, { cx: x + 345, cy: y + 80, h: 34, fill: C.deep, weight: 600, maxWidth: 360 });
}

export function botWelcome() {
  const body = `<rect width="1280" height="720" fill="${C.amber}"/>` + squircle(80, 80, 160, C.deep) +
    markR({ cx: 160, cy: 160, h: 100, fill: C.amber }) +
    textCentered('Rida haydovchilar uchun', { cx: 720, cy: 140, h: 56, fill: C.deep, maxWidth: 820 }) +
    textCentered('Manzil sari', { cx: 720, cy: 210, h: 30, fill: C.deep, weight: 600 }) +
    POINTS.map(point).join('');
  return svg(1280, 720, body);
}
