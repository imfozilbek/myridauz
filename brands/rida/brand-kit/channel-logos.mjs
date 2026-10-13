// The logos of the channels of the directions for the apps (owner decision 13.10.2026, docs/176): the
// 67 channels have in Telegram the avatar of their region, so the app shows the same picture, made
// from the same master (lib/channels.mjs) into brands/rida/public/channels/<code>.webp.
// Usage: pnpm logos
import fs from 'node:fs';
import sharp from 'sharp';
import { channelAvatar } from './lib/channels.mjs';

const OUT = new URL('../public/channels/', import.meta.url);
// Three times the largest logo of the apps (44 px in a row).
const SIZE = 144;
const QUALITY = 85;
const regions = JSON.parse(fs.readFileSync(new URL('data/regions.json', import.meta.url), 'utf8'));

fs.mkdirSync(OUT, { recursive: true });
for (const region of regions)
  await sharp(Buffer.from(channelAvatar(region)))
    .resize(SIZE)
    .webp({ quality: QUALITY })
    .toFile(new URL(`${region.code}.webp`, OUT).pathname);
console.log(`${regions.length} channel logos`);
