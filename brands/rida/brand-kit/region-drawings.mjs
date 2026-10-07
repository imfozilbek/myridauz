// Line drawings of the 14 regions for the apps (docs/118): from brands/rida/public/regions/<code>.webp
// to regions/lines/<app>/<code>.webp, in the colors of theme.ts (lesson 10: never by hand).
// Usage: pnpm regions
import fs from 'node:fs';
import sharp from 'sharp';
import { theme } from '../theme.ts';
import { BLUR_SIGMA, SIZE, colorize, frameOf } from './lib/drawing.mjs';

const PHOTOS = new URL('../public/regions/', import.meta.url);
const QUALITY = 82;
const APPS = {
  passenger: { paper: theme.colors.brandSoft, line: theme.colors.brandStrong },
  driver: { paper: theme.apps.driver.brandSoft, line: theme.apps.driver.brandStrong },
};

async function draw(code) {
  const photo = new URL(`${code}.webp`, PHOTOS).pathname;
  const { width, height } = await sharp(photo).metadata();
  const gray = sharp(photo).extract(frameOf(width, height)).resize(SIZE).grayscale();
  const plain = await gray.clone().raw().toBuffer();
  const blurredNegative = await gray.clone().negate().blur(BLUR_SIGMA).raw().toBuffer();
  for (const [app, colors] of Object.entries(APPS)) {
    const pixels = colorize(plain, blurredNegative, colors.paper, colors.line);
    const out = new URL(`lines/${app}/${code}.webp`, PHOTOS);
    fs.mkdirSync(new URL('.', out), { recursive: true });
    await sharp(pixels, { raw: { ...SIZE, channels: 3 } })
      .webp({ quality: QUALITY })
      .toFile(out.pathname);
  }
}

const codes = fs.readdirSync(PHOTOS).filter((name) => name.endsWith('.webp')).map((name) => name.slice(0, -5));
for (const code of codes) await draw(code);
console.log(`${codes.length} regions × ${Object.keys(APPS).length} apps`);
