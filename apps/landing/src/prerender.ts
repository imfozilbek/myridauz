import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadBrand } from '@platform/brands';
import { toCyrillic } from '@platform/i18n';
import type { HeroRoads, MapData, RegionName } from './map-data';
import { renderSite } from './site';

// Build step (docs/59): writes the pages of the brand to apps/landing/dist with the inline script
// and copies the icons and the pictures of brands/<brand>/landing.
const brand = loadBrand(process.env['VITE_BRAND'], process.env['VITE_ENVIRONMENT']);
const from = (path: string) => fileURLToPath(new URL(path, import.meta.url));
const dist = from('../dist/');
const data = (file: string) =>
  JSON.parse(readFileSync(from(`../../../brands/${brand.id}/brand-kit/data/${file}`), 'utf8'));
// The names of the brand kit are written in Latin; the site shows them in Cyrillic (G98, docs/228).
const latinMap = data('uzbekistan.json') as MapData;
const map: MapData = {
  ...latinMap,
  cities: latinMap.cities.map((city) => ({ ...city, name: toCyrillic(city.name) })),
};
const roads = data('hero-roads.json') as HeroRoads;
const regions = (data('regions.json') as RegionName[]).map((region) => ({
  ...region,
  region: toCyrillic(region.region),
}));
const script = readFileSync(from('../.client/app.js'), 'utf8').trim();
rmSync(dist, { recursive: true, force: true });
for (const [file, html] of Object.entries(
  renderSite(brand, { year: new Date().getFullYear(), map, roads, regions, script }),
)) {
  const path = `${dist}${file}`;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, html);
}
cpSync(from(`../../../brands/${brand.id}/landing/`), dist, { recursive: true });
console.log(`landing: ${brand.id} written to ${dist}`);
