// A screen of a Mini App whole in a thin phone (the flyer, the ads): a shot of the stand
// (e2e/stand/flyer-shots.spec.ts), a short phone of 390 x 640 at twice the density.
import fs from 'node:fs';
import { C } from './palette.mjs';

const SHOT = { width: 780, height: 1280 };
// The height of a phone of this width, its bezel in.
export const phoneHeight = (width, bezel) => Math.round((SHOT.height * (width - 2 * bezel)) / SHOT.width) + 2 * bezel;

// file: the shot under data/flyer-screens, without .jpg; id: unique in its picture (the clip of the screen).
export function phone({ id, file, x, y, width, bezel = 6 }) {
  const inner = width - 2 * bezel, ih = phoneHeight(width, bezel) - 2 * bezel, r = Math.round(width * 0.117);
  const jpg = fs.readFileSync(new URL(`../data/flyer-screens/${file}.jpg`, import.meta.url)).toString('base64');
  return `<clipPath id="clip-${id}"><rect x="${x + bezel}" y="${y + bezel}" width="${inner}" height="${ih}" rx="${r - bezel}"/></clipPath>` +
    `<rect x="${x}" y="${y}" width="${width}" height="${ih + 2 * bezel}" rx="${r}" fill="${C.ink}"/>` +
    `<image href="data:image/jpeg;base64,${jpg}" x="${x + bezel}" y="${y + bezel}" width="${inner}" height="${ih}" clip-path="url(#clip-${id})"/>`;
}
