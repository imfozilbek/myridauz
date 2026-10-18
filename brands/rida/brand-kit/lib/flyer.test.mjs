import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { COMBOS } from './palette.mjs';
import { flyerSide, FLYER_MM } from './flyer.mjs';

const [flyer] = JSON.parse(fs.readFileSync(new URL('../data/flyers.json', import.meta.url), 'utf8'));
const MM = 300 / 25.4;
// A tile and the R drawn right after it: the logo on the band (150) and in the middle of the QR.
const tiles = (side) => [...side.matchAll(/<rect x="[\d.]+" y="[\d.]+" width="([\d.]+)" height="\1" rx="[\d.]+" fill="(#[0-9A-F]{6})"\/><path d="[^"]+" fill="(#[0-9A-F]{6})"\/>/gu)]
  .map(([, , bg, fg]) => ({ bg, fg }));
const qrOf = (side) => side.match(/<path d="([^"]+)" fill="#[0-9A-F]{6}" shape-rendering="crispEdges"\/>/u)?.[1];

describe('the flyer of a direction', () => {
  // The print shop cuts 99 x 210 mm out of a page with 3 mm of bleed on every edge, at 300 dpi.
  it.each(['passenger', 'driver'])('has the %s side at 105 x 216 mm and 300 dpi', (side) => {
    const [, w, h] = flyerSide(side, flyer).match(/width="(\d+)" height="(\d+)"/u) ?? [];
    expect([Number(w), Number(h)]).toEqual([Math.round(FLYER_MM.width * MM), Math.round(FLYER_MM.height * MM)]);
  });

  // docs/36: the band and the QR wear combos of the table only (lesson №313).
  it.each([
    ['passenger', [COMBOS[2], COMBOS[1]]],
    ['driver', [COMBOS[4], COMBOS[3]]],
  ])('wears the logo of the %s side in combos of the table', (side, combos) => {
    expect(tiles(flyerSide(side, flyer))).toEqual(combos);
  });

  // Each QR leads to the bot of its side: a new ad link changes only the QR of that side (docs/184).
  it('draws the QR of a side from the link of that side', () => {
    const relinked = { ...flyer, driver: `${flyer.driver}=__ad-k7f2qx` };
    expect(qrOf(flyerSide('driver', relinked))).not.toBe(qrOf(flyerSide('driver', flyer)));
    expect(qrOf(flyerSide('passenger', relinked))).toBe(qrOf(flyerSide('passenger', flyer)));
  });
});
