// Telegram's chat list: the Rida bot and regional channels (Telegram's own screen, no Mini App header).
import fs from 'node:fs';
import { C } from '../../lib/palette.mjs';
import { markR } from '../../lib/text.mjs';
import { channelAvatar } from '../../lib/channels.mjs';
import { COPY, enter } from '../kit.mjs';
import { ui, UI, statusBar } from '../phone.mjs';
import { icon } from '../icons.mjs';
import { sep } from '../ui.mjs';

const K = COPY.chats;
const REGIONS = JSON.parse(fs.readFileSync(new URL('../../data/regions.json', import.meta.url), 'utf8'));
const UNREAD = ['1', '12', '4', '7', '2'];

const botAvatar = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.teal}"/>` + markR({ cx, cy, h: r * 0.9, fill: C.white });
const channel = (region, id) => (cx, cy, r) => `<clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath><g clip-path="url(#${id})">` +
  channelAvatar(region).replace('<svg ', `<svg x="${cx - r}" y="${cy - r}" `).replace('width="640" height="640"', `width="${r * 2}" height="${r * 2}"`) + '</g>';

function row(t, i, avatar, name, last) {
  const y = 86 + i * 78, p = enter(t, 0.25 + i * 0.12, 0.35);
  return `<g opacity="${p.toFixed(3)}"><rect y="${y}" width="390" height="78" fill="${C.white}"/>` + avatar(44, y + 39, 29) +
    ui(name, 86, y + 32, { size: 16, weight: 500, maxWidth: 220 }) + ui(last, 86, y + 57, { size: 14, fill: C.muted, maxWidth: 240 }) +
    ui(K.times[i], 366, y + 32, { size: 13, fill: C.muted, anchor: 'end' }) +
    `<circle cx="354" cy="${y + 52}" r="11" fill="${C.grey}"/>` + ui(UNREAD[i], 354, y + 57, { size: 12, weight: 500, fill: C.white, anchor: 'middle' }) +
    sep(y + 78, 86) + '</g>';
}

export function chats(t) {
  const list = K.channels.map((c, i) => {
    const region = REGIONS.find((r) => r.code === c.code);
    return row(t, i + 1, channel(region, `tg${i}`), `Rida | ${region.title}`, c.last);
  }).join('');
  return `<rect width="390" height="825" fill="${C.white}"/>` + statusBar() + icon('Menu', 28, 58, 22, C.muted) +
    ui(K.title, 68, 65, { size: 20, weight: 500 }) + icon('Search', 362, 58, 22, C.muted) +
    `<rect y="85" width="390" height="1" fill="${UI.line}"/>` + row(t, 0, botAvatar, K.bot, K.botLast) + list;
}
