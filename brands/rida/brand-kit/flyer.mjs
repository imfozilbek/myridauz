// Builds the print flyers of the directions (99 x 210 mm with 3 mm of bleed) into ./kit/print:
// a PDF of two pages for the print shop, an SVG master and a PNG (300 dpi) of each side, and the sheets
// to cut them from (owner, 18.10.2026): one flyer at its 99 x 210 mm, A4 with 3 flyers across, A3 with
// 3 x 2; page 1 the passenger side, page 2 the driver side. A sheet holds the flyers edge to edge, without bleed.
import fs from 'node:fs';
import { chromium } from 'playwright';
import { PDFDocument } from 'pdf-lib';
import { flyerSide, FLYER_MM } from './lib/flyer.mjs';

const OUT = 'kit/print';
const SIDES = { passenger: 'yolovchi', driver: 'haydovchi' };
const SHEETS = [
  { name: '99x210', width: 99, height: 210, columns: 1, rows: 1 },
  { name: 'a4', width: 297, height: 210, columns: 3, rows: 1 },
  { name: 'a3', width: 297, height: 420, columns: 3, rows: 2 },
];
const POINTS_PER_MM = 72 / 25.4;
const TRIM = { width: FLYER_MM.width - 2 * FLYER_MM.bleed, height: FLYER_MM.height - 2 * FLYER_MM.bleed };
const flyers = JSON.parse(fs.readFileSync('data/flyers.json', 'utf8'));
const sizeOf = (s) => s.match(/width="([\d.]+)" height="([\d.]+)"/).slice(1).map(Number);
const sized = (s, w, h, box) =>
  s.replace(/^<svg([^>]*?) width="[\d.]+" height="[\d.]+" viewBox="[^"]+"/, `<svg$1 width="${w}" height="${h}" viewBox="${box}"`);
// The side cut to its trim: the bleed stays outside the view box.
function trimmed(master) {
  const [w] = sizeOf(master), px = w / FLYER_MM.width, b = FLYER_MM.bleed * px;
  return sized(master, `${TRIM.width}mm`, `${TRIM.height}mm`, `${b} ${b} ${TRIM.width * px} ${TRIM.height * px}`);
}
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const page = await browser.newPage();
// Chromium rounds a page up to its own grid (99 mm comes out 99.14): the box of each page is set back to
// the exact size, from the top left corner where the drawing starts; the strip cut off is empty.
async function pdf(path, width, height, pages) {
  const css = `@page{size:${width}mm ${height}mm;margin:0}body{margin:0}svg{display:block}.page{display:flex;flex-wrap:wrap;width:${width}mm;height:${height}mm;break-after:page}`;
  await page.setContent(`<html><head><style>${css}</style></head><body>${pages.map((p) => `<div class="page">${p}</div>`).join('')}</body></html>`);
  const doc = await PDFDocument.load(await page.pdf({ width: `${width}mm`, height: `${height}mm`, printBackground: true }));
  const [w, h] = [width * POINTS_PER_MM, height * POINTS_PER_MM];
  for (const sheet of doc.getPages()) {
    const top = sheet.getHeight();
    sheet.setMediaBox(0, top - h, w, h);
    sheet.setTrimBox(0, top - h, w, h);
  }
  fs.writeFileSync(path, await doc.save());
}
for (const flyer of flyers) {
  const masters = [];
  for (const [side, name] of Object.entries(SIDES)) {
    const master = flyerSide(side, flyer), [w, h] = sizeOf(master);
    fs.writeFileSync(`${OUT}/flyer-${flyer.id}-${name}.svg`, master);
    await page.setViewportSize({ width: w, height: h });
    await page.setContent(`<html><body style="margin:0">${master}</body></html>`);
    await page.screenshot({ path: `${OUT}/flyer-${flyer.id}-${name}.png`, clip: { x: 0, y: 0, width: w, height: h } });
    masters.push(master);
  }
  const bled = masters.map((m) => sized(m, `${FLYER_MM.width}mm`, `${FLYER_MM.height}mm`, m.match(/viewBox="([^"]+)"/)[1]));
  await pdf(`${OUT}/flyer-${flyer.id}.pdf`, FLYER_MM.width, FLYER_MM.height, bled);
  for (const sheet of SHEETS) {
    const pages = masters.map((m) => trimmed(m).repeat(sheet.columns * sheet.rows));
    await pdf(`${OUT}/flyer-${flyer.id}-${sheet.name}.pdf`, sheet.width, sheet.height, pages);
  }
}
await browser.close();
console.log(`flyers: ${flyers.map((f) => f.id).join(', ')}`);
