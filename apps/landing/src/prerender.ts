import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadBrand } from '@platform/brands';
import type { ChannelTitles, MapData } from './map-data';
import { renderSite } from './site';

// Build step (docs/59): writes the pages of the brand to apps/landing/dist with the inline script
// and copies the icons and the pictures of brands/<brand>/landing.
const brand = loadBrand(process.env['VITE_BRAND']);
const from = (path: string) => fileURLToPath(new URL(path, import.meta.url));
const dist = from('../dist/');
const data = (file: string) =>
  JSON.parse(readFileSync(from(`../../../brands/${brand.id}/brand-kit/data/${file}`), 'utf8'));
const map = data('uzbekistan.json') as MapData;
const channels: ChannelTitles = Object.fromEntries(
  (data('regions.json') as { user: string; title: string; code: string }[]).map(({ user, title, code }) => [
    user,
    { title, code },
  ]),
);
const script = readFileSync(from('../.client/app.js'), 'utf8').trim();
rmSync(dist, { recursive: true, force: true });
for (const [file, html] of Object.entries(
  renderSite(brand, { year: new Date().getFullYear(), map, channels, script }),
)) {
  const path = `${dist}${file}`;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, html);
}
cpSync(from(`../../../brands/${brand.id}/landing/`), dist, { recursive: true });
console.log(`landing: ${brand.id} written to ${dist}`);
