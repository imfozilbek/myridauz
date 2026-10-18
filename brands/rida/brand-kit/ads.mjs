// Builds the pictures 16:9 for Telegram Ads into ./kit/ads: a PNG of 1920 x 1080 for each ad of lib/ads.mjs,
// on the direction and the screens of the first flyer (data/flyers.json).
import fs from 'node:fs';
import { chromium } from 'playwright';
import { ADS, AD_SIZE, adVisual } from './lib/ads.mjs';

const OUT = 'kit/ads';
const [flyer] = JSON.parse(fs.readFileSync('data/flyers.json', 'utf8'));
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const page = await browser.newPage({ viewport: AD_SIZE });
for (const ad of ADS) {
  await page.setContent(`<html><body style="margin:0">${adVisual(ad, flyer)}</body></html>`);
  await page.screenshot({ path: `${OUT}/rida-ads-${ad.id}.png`, clip: { x: 0, y: 0, ...AD_SIZE } });
}
await browser.close();
console.log(`ads: ${ADS.length}`);
