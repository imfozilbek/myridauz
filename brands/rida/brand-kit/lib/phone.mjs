// A screen of a Mini App in a phone of 390 x 844 (the flyer, the ads), as people see it inside Telegram: the
// status bar, the header of Telegram with the name, the view of the Mini App shot on the stand
// (e2e/stand/flyer-shots.spec.ts, 390 x 707 at twice the density) and the bottom with the home bar.
import fs from 'node:fs';
import { text } from './text.mjs';
import { C } from './palette.mjs';
import { icon } from '../promo/icons.mjs';
import { NAME } from './production.mjs';

const PHONE = { width: 390, height: 844, status: 47, header: 56, view: 707 };
// The height of a phone of this width, its bezel in.
export const phoneHeight = (width, bezel) => Math.round((PHONE.height * (width - 2 * bezel)) / PHONE.width) + 2 * bezel;

// file: the shot under data/flyer-screens, without .jpg; id: unique in its picture (the clip of the screen).
export function phone({ id, file, x, y, width, bezel = 6 }) {
  const inner = width - 2 * bezel, s = inner / PHONE.width, ix = x + bezel, iy = y + bezel, r = Math.round(width * 0.13);
  const px = (v) => v * s, head = iy + px(PHONE.status), view = head + px(PHONE.header);
  const jpg = fs.readFileSync(new URL(`../data/flyer-screens/${file}.jpg`, import.meta.url)).toString('base64');
  const status = text('9:41', { x: ix + px(30), y: iy + px(31), fill: C.ink, weight: 600, size: px(16) }) +
    ['Signal', 'Wifi', 'BatteryFull'].map((name, i) => icon(name, ix + inner - px(80 - i * 26), iy + px(24), px(17), C.ink, 2.2)).join('');
  const header = icon('X', ix + px(28), head + px(28), px(22), C.ink, 2.2) +
    text(NAME, { x: ix + inner / 2, y: head + px(34), anchor: 'middle', fill: C.ink, weight: 600, size: px(17) }) +
    icon('EllipsisVertical', ix + inner - px(28), head + px(28), px(22), C.ink, 2.2);
  return `<clipPath id="clip-${id}"><rect x="${ix}" y="${iy}" width="${inner}" height="${px(PHONE.height)}" rx="${r - bezel}"/></clipPath>` +
    `<rect x="${x}" y="${y}" width="${width}" height="${px(PHONE.height) + 2 * bezel}" rx="${r}" fill="${C.ink}"/>` +
    `<g clip-path="url(#clip-${id})"><rect x="${ix}" y="${iy}" width="${inner}" height="${px(PHONE.height)}" fill="${C.white}"/>` +
    `<image href="data:image/jpeg;base64,${jpg}" x="${ix}" y="${view}" width="${inner}" height="${px(PHONE.view)}"/></g>` +
    status + header +
    `<rect x="${ix + inner / 2 - px(67)}" y="${iy + px(PHONE.height - 13)}" width="${px(134)}" height="${px(5)}" rx="${px(2.5)}" fill="${C.ink}"/>`;
}
