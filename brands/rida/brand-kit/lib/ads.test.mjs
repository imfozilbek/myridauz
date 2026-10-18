import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { COMBOS } from './palette.mjs';
import { ADS, AD_SIZE, adVisual } from './ads.mjs';

const [flyer] = JSON.parse(fs.readFileSync(new URL('../data/flyers.json', import.meta.url), 'utf8'));
// The logo in the corner: the tile of 110 and the R drawn right after it.
const LOGO = /<rect x="110" y="90" width="110" height="110" rx="[\d.]+" fill="(#[0-9A-F]{6})"\/><path d="[^"]+" fill="(#[0-9A-F]{6})"\/>/u;
const PASSENGER = new Set([COMBOS[1], COMBOS[2]].map((combo) => JSON.stringify(combo)));
const DRIVER = new Set([COMBOS[3], COMBOS[4]].map((combo) => JSON.stringify(combo)));

describe('the pictures of Telegram Ads', () => {
  it.each(ADS.map((ad) => [ad.id, ad]))('%s is 16:9 with two screens of the Mini App', (_, ad) => {
    const picture = adVisual(ad, flyer);
    expect(picture.match(/width="(\d+)" height="(\d+)"/u)?.slice(1).map(Number)).toEqual([AD_SIZE.width, AD_SIZE.height]);
    expect(picture.match(/<image href="data:image\/jpeg;base64,/gu)).toHaveLength(2);
  });

  // docs/36: the logo of each side in combos of the table only, in the color of its bot (lesson №313).
  it.each(ADS.map((ad) => [ad.id, ad]))('%s wears the logo of its bot', (id, ad) => {
    const [, bg, fg] = adVisual(ad, flyer).match(LOGO) ?? [];
    expect((id.startsWith('yolovchi') ? PASSENGER : DRIVER).has(JSON.stringify({ bg, fg }))).toBe(true);
  });
});
