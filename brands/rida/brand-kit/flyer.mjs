// Builds the print flyers of the directions (99 x 210 mm with 3 mm of bleed) into ./kit/print:
// a PDF of two pages for the print shop, an SVG master and a PNG (300 dpi) of each side.
import fs from 'node:fs';
import { chromium } from 'playwright';
import { flyerSide, FLYER_MM } from './lib/flyer.mjs';

const OUT = 'kit/print';
const SIDES = { passenger: 'yolovchi', driver: 'haydovchi' };
const flyers = JSON.parse(fs.readFileSync('data/flyers.json', 'utf8'));
const sized = (s, w, h) => s.replace(/^<svg([^>]*?) width="[\d.]+" height="[\d.]+"/, `<svg$1 width="${w}" height="${h}"`);
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const page = await browser.newPage();
for (const flyer of flyers) {
  const pages = [];
  for (const [side, name] of Object.entries(SIDES)) {
    const master = flyerSide(side, flyer), [, w, h] = master.match(/width="([\d.]+)" height="([\d.]+)"/).map(Number);
    fs.writeFileSync(`${OUT}/flyer-${flyer.id}-${name}.svg`, master);
    await page.setViewportSize({ width: w, height: h });
    await page.setContent(`<html><body style="margin:0">${master}</body></html>`);
    await page.screenshot({ path: `${OUT}/flyer-${flyer.id}-${name}.png`, clip: { x: 0, y: 0, width: w, height: h } });
    pages.push(sized(master, `${FLYER_MM.width}mm`, `${FLYER_MM.height}mm`));
  }
  const css = `@page{size:${FLYER_MM.width}mm ${FLYER_MM.height}mm;margin:0}body{margin:0}svg{display:block;break-after:page}`;
  await page.setContent(`<html><head><style>${css}</style></head><body>${pages.join('')}</body></html>`);
  await page.pdf({ path: `${OUT}/flyer-${flyer.id}.pdf`, width: `${FLYER_MM.width}mm`, height: `${FLYER_MM.height}mm`, printBackground: true });
}
await browser.close();
console.log(`flyers: ${flyers.map((f) => f.id).join(', ')}`);
