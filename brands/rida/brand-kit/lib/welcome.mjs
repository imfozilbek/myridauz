// The picture of the first message of a bot (G34, docs/95): what Rida gives this person, four
// signs on the color of the bot. The bonus comes from the brand config, never typed here.
import { icon } from '../promo/icons.mjs';
import { squircle } from './brand.mjs';
import { C, svg } from './palette.mjs';
import { markR, textCentered } from './text.mjs';
import { brandConfig } from '../../brand.config.ts';

const hours = ({ from, to }) => `${from}:00 dan ${to}:00 gacha`;
const money = (amount) => `${String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} soʻm`;
const ROLES = {
  driver: {
    bg: C.amber, tile: C.deep, sign: C.amber, ink: C.deep, title: 'Rida haydovchilar uchun',
    points: [
      ['CarFront', 'Safar bir daqiqada'],
      ['Users', 'Yoʻlovchi sizni topadi'],
      ['Banknote', 'Yoʻl xarajati qaytadi'],
      ['Gift', `${money(brandConfig.promo.amount)} bonus`],
    ],
  },
  // The passenger bot (owner request 03.10.2026): the same picture on the brand teal.
  passenger: {
    bg: C.teal, tile: C.teal, sign: C.white, ink: C.deep, title: 'Rida yoʻlovchilar uchun', head: C.white,
    points: [
      ['Search', 'Safar bir daqiqada'],
      ['ShieldCheck', 'Haydovchi tekshirilgan'],
      ['Venus', 'Mashinada ayol bor'],
      ['Lock', 'Raqamingiz yashirin'],
    ],
  },
  // The support bot (owner request 03.10.2026): its own white, as its avatar; the team hours come
  // from the brand config.
  support: {
    bg: C.white, card: C.soft, tile: C.teal, sign: C.white, ink: C.deep, title: 'Rida yordam xizmati',
    points: [
      ['MessageCircle', 'Savolingizni yozing'],
      ['Mic', 'Ovozli xabar ham boʻladi'],
      ['Image', 'Rasm ham yuborsa boʻladi'],
      ['Clock', `Har kuni ${hours(brandConfig.moderation.hours)}`],
    ],
  },
};

function point(look, [name, line], index) {
  const x = 80 + (index % 2) * 570, y = 300 + Math.floor(index / 2) * 190;
  return `<rect x="${x}" y="${y}" width="550" height="160" rx="36" fill="${look.card ?? C.white}"/>` +
    squircle(x + 28, y + 28, 104, look.tile) + icon(name, x + 80, y + 80, 60, look.sign, 2.2) +
    textCentered(line, { cx: x + 345, cy: y + 80, h: 34, fill: C.deep, weight: 600, maxWidth: 360 });
}

export function botWelcome(role = 'driver') {
  const look = ROLES[role];
  const head = look.head ?? look.ink;
  const body = `<rect width="1280" height="720" fill="${look.bg}"/>` + squircle(80, 80, 160, C.deep) +
    markR({ cx: 160, cy: 160, h: 100, fill: role === 'driver' ? C.amber : C.white }) +
    textCentered(look.title, { cx: 720, cy: 140, h: 56, fill: head, maxWidth: 820 }) +
    textCentered('Manzil sari', { cx: 720, cy: 210, h: 30, fill: head, weight: 600 }) +
    look.points.map((each, index) => point(look, each, index)).join('');
  return svg(1280, 720, body);
}
