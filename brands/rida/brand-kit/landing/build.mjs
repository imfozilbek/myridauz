// Pictures for the landing (docs/59) from the drawings of the promo video (docs/41): the same car,
// road, phones and crowd. Writes WebP files to brands/rida/landing/art, which are committed.
// Usage: CHROMIUM=… pnpm landing
import fs from 'node:fs';
import { chromium } from 'playwright';
import { svg } from '../lib/palette.mjs';
import { W, H } from '../promo/kit.mjs';
import { phone } from '../promo/phone.mjs';
import { map } from '../promo/scenes/map.mjs';
import { finale } from '../promo/scenes/finale.mjs';
import { search } from '../promo/screens/search.mjs';
import { results } from '../promo/screens/results.mjs';
import { trip } from '../promo/screens/trip.mjs';
import { chat } from '../promo/screens/chat.mjs';
import { publish } from '../promo/screens/publish.mjs';
import { requests } from '../promo/screens/requests.mjs';
import { chats } from '../promo/screens/chats.mjs';

const OUT = new URL('../../landing/art/', import.meta.url);
const QUALITY = 0.82;
// The phone with its shadow inside the 1080 × 1920 frame of the video.
const PHONE = { x: 60, y: 290, width: 960, height: 1630 };
const PHONE_WIDTH = 560;

// The first screen: all of Uzbekistan with the routes from Toshkent to every region (docs/41).
const MAP_BOX = { x: 20, y: 540, width: 1040, height: 740 };

// The phones of both paths, each at the moment its step is done (docs/41 timings).
const PHONES = {
  'phone-search': search(3.9), 'phone-results': results(1.5), 'phone-trip': trip(3.9), 'phone-chat': chat(3.9),
  'phone-publish': publish(2.6), 'phone-requests': requests(7.9), 'phone-telegram': chats(2)
};

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.setContent('<html><body style="margin:0;background:transparent"><div id="s"></div></body></html>');

// Draws the SVG, cuts the box and saves WebP through a canvas (Chromium has no WebP screenshots).
async function save(name, body, clip, width) {
  await page.evaluate((s) => { document.getElementById('s').innerHTML = s; }, body);
  const png = await page.screenshot({ clip, omitBackground: true });
  const webp = await page.evaluate(async ([data, w, q]) => {
    const img = new Image();
    img.src = `data:image/png;base64,${data}`;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = Math.round((img.height * w) / img.width);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/webp', q).split(',')[1];
  }, [png.toString('base64'), width, QUALITY]);
  fs.writeFileSync(new URL(`${name}.webp`, OUT), Buffer.from(webp, 'base64'));
  console.log(`${name}.webp ${Math.round((webp.length * 3) / 4 / 1024)} KB`);
}

fs.mkdirSync(OUT, { recursive: true });
await save('hero-map', svg(W, H, map(3.3)), MAP_BOX, W);
// The crowd of people that becomes the R, before it turns into the logo.
await save('crowd', svg(W, H, finale(3.8)), { x: 0, y: 520, width: W, height: 880 }, 900);
for (const [name, screen] of Object.entries(PHONES)) {
  const withChrome = name !== 'phone-telegram';
  await save(name, svg(W, H, phone(screen, { withChrome })), PHONE, PHONE_WIDTH);
}
await browser.close();
