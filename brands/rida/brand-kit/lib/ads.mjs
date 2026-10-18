// Pictures 16:9 for Telegram Ads (owner, 18.10.2026): three for the bot of passengers, three for the bot of
// drivers. A headline, a line under it and two real screens of the Mini App (lib/phone.mjs). Texts are the
// approved ones of the landing (docs/60), the flyer and the posts of the brand kit (docs/38).
import { text, markR, layout } from './text.mjs';
import { C, COMBOS, svg } from './palette.mjs';
import { squircle } from './brand.mjs';
import { icon } from '../promo/icons.mjs';
import { NAME, PROMO } from './production.mjs';
import { phone, phoneHeight } from './phone.mjs';
import { routeCard } from './route-card.mjs';
import { theme } from '../../theme.ts';

export const AD_SIZE = { width: 1920, height: 1080 };
const { width: W, height: H } = AD_SIZE, M = 110, PHONE = { width: 380, gap: 36, bezel: 8 };
const LEFT = W - M - 2 * PHONE.width - PHONE.gap - 70 - M; // the column of the words
const driverApp = theme.apps.driver;
// The colors of the bot of each side (docs/20); the logo in combos of the table only (docs/36, lesson №313).
const LOOKS = {
  teal: { bg: C.teal, ink: C.white, sub: C.mint, chip: C.white, chipInk: C.ink, accent: C.teal, logo: COMBOS[2], name: C.white },
  amber: { bg: driverApp.brandStrong, ink: C.white, sub: driverApp.brandMint, chip: C.white, chipInk: C.ink, accent: driverApp.brandStrong, logo: COMBOS[4], name: C.white },
  mint: { bg: C.soft, ink: C.ink, sub: C.muted, chip: C.white, chipInk: C.ink, accent: C.teal, logo: COMBOS[1], name: C.teal },
  sand: { bg: driverApp.brandSoft, ink: C.ink, sub: C.muted, chip: C.white, chipInk: C.ink, accent: driverApp.brandStrong, logo: COMBOS[3], name: driverApp.brandStrong },
};
const sum = (n) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} soʻm`;
export const ADS = [
  { id: 'yolovchi-1', look: 'teal', title: ['Safar toping'], sub: 'Viloyatlararo birga safarlar',
    chips: [['ShieldCheck', 'Tekshirilgan haydovchilar'], ['EyeOff', 'Raqamingiz yashirin']], screens: ['passenger-3', 'passenger-4'] },
  { id: 'yolovchi-2', look: 'mint', title: ['Ayollar uchun', 'xotirjam safar'], sub: 'Shu belgili safarlarni tanlang',
    badge: ['Venus', 'Mashinada ayol bor'], screens: ['passenger-3', 'passenger-2'] },
  { id: 'yolovchi-3', look: 'teal', route: true, title: ['Safar toping'], sub: 'Telegramda ochiladi. Ilova yuklab olish shart emas.',
    screens: ['passenger-2', 'passenger-4'] },
  { id: 'haydovchi-1', look: 'amber', title: ['Haydovchimisiz?'], sub: 'Safaringizga yoʻlovchi toping',
    box: ['Gift', 'Yangi haydovchilarga', `${sum(PROMO.amount * PROMO.grants)}gacha bonus`], screens: ['driver-3', 'driver-4'] },
  { id: 'haydovchi-2', look: 'sand', title: ['Narxni oʻzingiz', 'belgilaysiz'], sub: 'Safaringizga yoʻlovchi toping',
    chips: [['MessageSquareOff', 'Har 10 daqiqada yozish shart emas'], ['Clock', 'Pitakda kutish shart emas']], screens: ['driver-2', 'driver-1'] },
  { id: 'haydovchi-3', look: 'amber', route: true, title: ['Yoʻlovchilar', 'sizni topadi'], sub: 'Safaringizni eʼlon qiling',
    screens: ['driver-1', 'driver-3'] },
];

const logo = (look) => squircle(M, 90, 110, look.logo.bg) + markR({ cx: M + 55, cy: 145, h: 68, fill: look.logo.fg }) +
  text(NAME, { x: M + 140, y: 178, fill: look.name, size: 84 });

// A row of white pills with an icon; the badge of «Mashinada ayol bor» is amber, as in the Mini App (docs/06).
function pills(look, list, y, fill = look.chip) {
  return list.map(([name, label], i) => {
    const top = y + i * 104, w = Math.min(LEFT, layout(label, { weight: 600, size: 44 }).width + 124);
    return `<rect x="${M}" y="${top}" width="${w}" height="84" rx="42" fill="${fill}"/>` + icon(name, M + 52, top + 42, 44, fill === look.chip ? look.accent : C.ink, 2.25) +
      text(label, { x: M + 92, y: top + 58, fill: look.chipInk, weight: 600, size: 44, maxWidth: LEFT - 116 });
  }).join('');
}

function bonus(look, [name, lead, label], y) {
  return `<rect x="${M}" y="${y}" width="${LEFT}" height="170" rx="40" fill="${C.teal}"/>` + icon(name, M + 80, y + 85, 64, C.white, 2.25) +
    text(lead, { x: M + 150, y: y + 70, fill: C.white, weight: 600, size: 40, maxWidth: LEFT - 180 }) +
    text(label, { x: M + 150, y: y + 132, fill: C.white, size: 56, maxWidth: LEFT - 180 });
}

// One picture of an ad; `flyer` gives the direction of its route and the folder of its screens.
export function adVisual(ad, flyer) {
  const look = LOOKS[ad.look], h = phoneHeight(PHONE.width, PHONE.bezel), x0 = W - M - 2 * PHONE.width - PHONE.gap;
  const phones = ad.screens.map((file, i) => phone({ id: `${ad.id}-${i}`, file: `${flyer.id}/${file}`, x: x0 + i * (PHONE.width + PHONE.gap),
    y: (H - h) / 2 + (i === 0 ? -34 : 34), width: PHONE.width, bezel: PHONE.bezel })).join('');
  // The route fits the column of the words at size 40: both names and the dashes between them.
  const route = ad.route ? routeCard({ x: M, y: 250, width: LEFT, from: flyer.from, to: flyer.to, size: 40 }) : '';
  let y = ad.route ? 470 : 360;
  const title = ad.title.map((line, n) => text(line, { x: M, y: y + 100 + n * 136, fill: look.ink, size: 124, maxWidth: LEFT })).join('');
  y += 100 + (ad.title.length - 1) * 136;
  const sub = text(ad.sub, { x: M, y: y + 88, fill: look.sub, weight: 600, size: 50, maxWidth: LEFT });
  y += 150;
  const extra = (ad.chips ? pills(look, ad.chips, y) : '') + (ad.badge ? pills(look, [ad.badge], y, C.amber) : '') + (ad.box ? bonus(look, ad.box, y) : '');
  return svg(W, H, `<rect width="${W}" height="${H}" fill="${look.bg}"/>` + logo(look) + route + title + sub + extra + phones);
}
